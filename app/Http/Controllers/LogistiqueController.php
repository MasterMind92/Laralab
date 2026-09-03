<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Appartement;
use App\Models\Besoin;
use App\Models\Commande;
use App\Models\CommandeLigne;
use App\Models\Employe;
use App\Models\Equipement;
use App\Models\Fournisseur;
use App\Models\Reception;
use App\Models\ReceptionLigne;
use App\Notifications\Interne\BesoinAValider;
use App\Notifications\Interne\CommandeRecue;
use App\Notifications\Interne\EcartReception;
use App\Support\Destinataires;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Les cinq écrans du pôle Logistique (Phase 10, étape B) : la chaîne
 * `Besoin → Commande → Réception → Enregistrement → Affectation`.
 *
 * Deux règles gouvernent tout ce contrôleur.
 *
 * 1. **Les identifiants venus d'une requête sont résolus par une requête CLOISONNÉE**, et
 *    jamais par une règle `exists:table,id` — celle-ci ignore les global scopes et
 *    laisserait rattacher une commande au fournisseur d'une autre entreprise. Un
 *    `findOrFail()` sur un modèle scopé renvoie 404 pour ce qui n'appartient pas au
 *    locataire, ce qui est exactement le comportement voulu. `Equipement` n'ayant
 *    délibérément aucun scope (voir son en-tête), il est le seul à devoir être filtré à la
 *    main.
 *
 * 2. **Aucun statut de commande n'est écrit ici pour les deux étapes de réception** :
 *    `partiellement_recue` et `recue` sortent de `Commande::recalculerStatut()`, appelé
 *    après l'écriture d'une réception. Une commande ne fait jamais avancer le stock, c'est
 *    l'inverse.
 */
class LogistiqueController extends Controller
{
    use ExportsCsv;

    /**
     * Tableau de bord du pôle — remplace une page de démonstration entièrement en dur
     * (taux d'occupation à 50 %, chiffre d'affaires à 1 000 000, onglets inertes).
     *
     * Délibérément modeste : quatre compteurs et les deux files où le travail s'accumule.
     * Les indicateurs par pôle sont le périmètre de la Phase 07, et deux tableaux de bord
     * concurrents seraient pires qu'un seul tardif.
     */
    public function dashboard(): Response
    {
        $parStatutCommande = Commande::query()
            ->selectRaw('statut, COUNT(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        return Inertia::render('logistique/dashboard', [
            'kpi' => [
                'besoins_a_valider' => Besoin::where('statut', 'soumis')->count(),
                'besoins_a_commander' => Besoin::aCommander()->count(),
                'commandes_ouvertes' => Commande::ouvertes()->count(),
                'pieces_a_enregistrer' => (int) ReceptionLigne::aEnregistrer()
                    ->sum(DB::raw('quantite_recue - quantite_enregistree')),
            ],
            'parStatutCommande' => collect(Commande::STATUTS)
                ->map(fn (string $statut) => [
                    'statut' => $statut,
                    'total' => (int) ($parStatutCommande[$statut] ?? 0),
                ])
                ->values(),
            // Les livraisons attendues les plus anciennes d'abord : ce sont celles qui
            // coûtent, pas les dernières commandées.
            'livraisons_attendues' => Commande::query()
                ->whereIn('statut', ['envoyee', 'confirmee', 'partiellement_recue'])
                ->with(['fournisseur:id,nom', 'lignes'])
                ->orderByRaw('date_livraison_prevue IS NULL, date_livraison_prevue')
                ->limit(8)
                ->get()
                ->map(fn (Commande $c) => $this->ligneCommande($c)),
            'stock_disponible' => $this->equipementsDuPole()->where('statut', 'stock')->count(),
        ]);
    }

    // ---------------------------------------------------------------- Besoins

    public function besoins(Request $request): Response
    {
        $filtres = $request->validate([
            'statut' => ['nullable', 'in:'.implode(',', Besoin::STATUTS)],
            'priorite' => ['nullable', 'in:basse,normale,haute'],
        ]);

        $besoins = Besoin::with(['demandeur:id,nom,prenom', 'valideur:id,nom,prenom', 'appartement:id,numero'])
            ->when($filtres['statut'] ?? null, fn ($q, $s) => $q->where('statut', $s))
            ->when($filtres['priorite'] ?? null, fn ($q, $p) => $q->where('priorite', $p))
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('logistique/besoins', [
            'besoins' => $besoins->map(fn (Besoin $b) => $this->ligneBesoin($b)),
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom', 'poste']),
            'appartements' => Appartement::orderBy('numero')->get(['id', 'numero']),
            'filters' => $filtres,
        ]);
    }

    public function storeBesoin(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'demandeur_employe_id' => ['nullable', 'integer'],
            'appartement_id' => ['nullable', 'integer'],
            'designation' => ['required', 'string', 'max:255'],
            'quantite' => ['required', 'integer', 'min:1', 'max:9999'],
            'justification' => ['nullable', 'string', 'max:2000'],
            'priorite' => ['required', 'in:basse,normale,haute'],
        ]);

        Besoin::create([
            ...$data,
            'demandeur_employe_id' => $this->idEmployeCloisonne($data['demandeur_employe_id'] ?? null),
            'appartement_id' => $this->idAppartementCloisonne($data['appartement_id'] ?? null),
            'statut' => 'brouillon',
        ]);

        return back();
    }

    /**
     * Un besoin n'est modifiable qu'en brouillon : une fois soumis il engage le jugement
     * d'un valideur, et une fois commandé il engage un fournisseur.
     */
    public function updateBesoin(Request $request, Besoin $besoin): RedirectResponse
    {
        if ($besoin->statut !== 'brouillon') {
            return back()->withErrors(['besoin' => 'Seul un besoin en brouillon peut être modifié.']);
        }

        $data = $request->validate([
            'demandeur_employe_id' => ['nullable', 'integer'],
            'appartement_id' => ['nullable', 'integer'],
            'designation' => ['required', 'string', 'max:255'],
            'quantite' => ['required', 'integer', 'min:1', 'max:9999'],
            'justification' => ['nullable', 'string', 'max:2000'],
            'priorite' => ['required', 'in:basse,normale,haute'],
        ]);

        $besoin->update([
            ...$data,
            'demandeur_employe_id' => $this->idEmployeCloisonne($data['demandeur_employe_id'] ?? null),
            'appartement_id' => $this->idAppartementCloisonne($data['appartement_id'] ?? null),
        ]);

        return back();
    }

    /**
     * Soumission, validation, refus, retour en brouillon — une seule route, parce que
     * c'est une seule règle : `Besoin::TRANSITIONS`. Ajouter une étape ne doit pas
     * demander d'ajouter une route.
     *
     * `commande` est volontairement refusé ici : ce n'est pas une décision humaine, c'est
     * la conséquence de la création d'une commande (voir storeCommande()).
     */
    public function changerStatutBesoin(Request $request, Besoin $besoin): RedirectResponse
    {
        $data = $request->validate([
            'statut' => ['required', 'in:soumis,valide,refuse,brouillon'],
            'motif_refus' => ['nullable', 'string', 'max:2000'],
        ]);

        if (! $besoin->peutPasserA($data['statut'])) {
            return back()->withErrors([
                'statut' => "Passage impossible de « {$besoin->statut} » à « {$data['statut']} ».",
            ]);
        }

        if ($data['statut'] === 'refuse' && blank($data['motif_refus'] ?? null)) {
            return back()->withErrors(['motif_refus' => 'Un refus doit être motivé.']);
        }

        $besoin->update(['statut' => $data['statut'], 'motif_refus' => $data['motif_refus'] ?? null]);

        // Traçabilité du valideur : renseignée seulement à la validation, effacée si le
        // besoin retourne en brouillon — sinon un besoin corrigé porterait la signature
        // d'une décision qui ne concernait plus son contenu.
        $besoin->forceFill(match ($data['statut']) {
            'valide' => ['valide_par_id' => $request->user()->employe?->id, 'date_validation' => now()->toDateString()],
            'brouillon' => ['valide_par_id' => null, 'date_validation' => null],
            default => [],
        })->save();

        // Phase 12 : la soumission est le seul de ces quatre passages qui demande quelque
        // chose à quelqu'un d'autre. Valider, refuser et remettre en brouillon sont des
        // décisions prises DANS l'écran, par la personne qui le regarde déjà.
        if ($data['statut'] === 'soumis') {
            $besoin->load(['demandeur', 'appartement']);
            Notification::send(
                Destinataires::pourRole('logistique', $besoin->entreprise_id),
                new BesoinAValider($besoin),
            );
        }

        return back();
    }

    public function destroyBesoin(Besoin $besoin): RedirectResponse
    {
        if ($besoin->statut === 'commande') {
            return back()->withErrors(['besoin' => 'Un besoin déjà commandé ne peut pas être supprimé.']);
        }

        $besoin->delete();

        return back();
    }

    /**
     * La plage de dates porte sur la date d'EXPRESSION du besoin : c'est la question qu'on
     * se pose sur cette file (« qu'a-t-on demandé ce trimestre ? »), la validation n'étant
     * qu'un événement de son cycle.
     */
    public function exportBesoins(Request $request): StreamedResponse
    {
        // Les filtres d'écran sont acceptés en plus de la plage de dates : l'écran les
        // reporte dans l'URL d'export, et un fichier qui contiendrait tout alors que la
        // liste affichait un sous-ensemble serait un piège silencieux.
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'statut' => ['nullable', 'in:'.implode(',', Besoin::STATUTS)],
            'priorite' => ['nullable', 'in:basse,normale,haute'],
        ]);

        $besoins = Besoin::with(['demandeur:id,nom,prenom', 'valideur:id,nom,prenom', 'appartement:id,numero'])
            ->when($data['statut'] ?? null, fn ($q, $s) => $q->where('statut', $s))
            ->when($data['priorite'] ?? null, fn ($q, $p) => $q->where('priorite', $p))
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->orderByDesc('created_at')
            ->get();

        return $this->streamCsv(
            'besoins.csv',
            ['ID', 'Désignation', 'Quantité', 'Priorité', 'Statut', 'Demandeur', 'Destination', 'Justification', 'Valideur', 'Validé le', 'Motif du refus', 'Exprimé le'],
            $besoins->map(fn (Besoin $b) => [
                $b->id,
                $b->designation,
                $b->quantite,
                $b->priorite,
                $b->statut,
                $b->demandeur ? $b->demandeur->prenom.' '.$b->demandeur->nom : null,
                $b->appartement?->numero,
                $b->justification,
                $b->valideur ? $b->valideur->prenom.' '.$b->valideur->nom : null,
                $b->date_validation?->format('d/m/Y'),
                $b->motif_refus,
                $b->created_at?->format('d/m/Y'),
            ]),
        );
    }

    // -------------------------------------------------------------- Commandes

    public function commandes(Request $request): Response
    {
        $filtres = $request->validate([
            'statut' => ['nullable', 'in:'.implode(',', Commande::STATUTS)],
        ]);

        $commandes = Commande::with(['fournisseur:id,nom', 'lignes.besoin:id,designation'])
            ->when($filtres['statut'] ?? null, fn ($q, $s) => $q->where('statut', $s))
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('logistique/commandes', [
            'commandes' => $commandes->map(fn (Commande $c) => $this->ligneCommande($c)),
            'fournisseurs' => Fournisseur::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'contact']),
            // Les besoins encore disponibles : validés et pas encore portés sur une
            // commande. Proposer les autres laisserait choisir des lignes sans effet.
            'besoins_a_commander' => Besoin::aCommander()
                ->with('demandeur:id,nom,prenom')
                ->orderBy('designation')
                ->get()
                ->map(fn (Besoin $b) => [
                    'id' => $b->id,
                    'designation' => $b->designation,
                    'quantite' => $b->quantite,
                    'priorite' => $b->priorite,
                ]),
            'filters' => $filtres,
        ]);
    }

    public function storeFournisseur(Request $request): RedirectResponse
    {
        Fournisseur::create($request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'adresse' => ['nullable', 'string', 'max:255'],
        ]));

        return back();
    }

    public function storeCommande(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'fournisseur_id' => ['required', 'integer'],
            'date_livraison_prevue' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.besoin_id' => ['nullable', 'integer'],
            'lignes.*.designation' => ['required', 'string', 'max:255'],
            'lignes.*.quantite' => ['required', 'integer', 'min:1', 'max:9999'],
            'lignes.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
        ]);

        $fournisseur = Fournisseur::findOrFail($data['fournisseur_id']);

        DB::transaction(function () use ($data, $fournisseur) {
            $commande = Commande::create([
                'fournisseur_id' => $fournisseur->id,
                'date_commande' => now()->toDateString(),
                'date_livraison_prevue' => $data['date_livraison_prevue'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['lignes'] as $ligne) {
                // Le besoin n'est retenu que s'il est encore à commander : un identifiant
                // périmé ou étranger produit une ligne libre plutôt qu'une erreur, la
                // commande restant valable sans lui.
                $besoin = isset($ligne['besoin_id'])
                    ? Besoin::aCommander()->whereKey($ligne['besoin_id'])->first()
                    : null;

                CommandeLigne::create([
                    'commande_id' => $commande->id,
                    'besoin_id' => $besoin?->id,
                    'designation' => $ligne['designation'],
                    'quantite' => $ligne['quantite'],
                    'prix_unitaire' => $ligne['prix_unitaire'],
                ]);

                $besoin?->update(['statut' => 'commande']);
            }
        });

        return back();
    }

    public function changerStatutCommande(Request $request, Commande $commande): RedirectResponse
    {
        $data = $request->validate([
            'statut' => ['required', 'in:envoyee,confirmee,annulee'],
        ]);

        if (! $commande->peutPasserA($data['statut'])) {
            return back()->withErrors([
                'statut' => "Passage impossible de « {$commande->statut} » à « {$data['statut']} ».",
            ]);
        }

        $commande->forceFill(['statut' => $data['statut']])->save();

        return back();
    }

    /**
     * Une ligne par LIGNE de commande et non par commande : un export d'achats sert à
     * additionner et à comparer des articles, pas à recompter des bons.
     */
    public function exportCommandes(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'statut' => ['nullable', 'in:'.implode(',', Commande::STATUTS)],
        ]);

        $commandes = Commande::with(['fournisseur:id,nom', 'lignes.receptionLignes'])
            ->when($data['statut'] ?? null, fn ($q, $s) => $q->where('statut', $s))
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('date_commande', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('date_commande', '<=', $to))
            ->orderByDesc('date_commande')
            ->get();

        $lignes = $commandes->flatMap(fn (Commande $c) => $c->lignes->map(fn (CommandeLigne $l) => [
            $c->reference,
            $c->statut,
            $c->fournisseur?->nom,
            $c->date_commande?->format('d/m/Y'),
            $c->date_livraison_prevue?->format('d/m/Y'),
            $l->designation,
            $l->quantite,
            $l->quantiteRecue(),
            $l->quantiteRestante(),
            number_format((float) $l->prix_unitaire, 0, ',', ' '),
            number_format($l->montant(), 0, ',', ' '),
        ]));

        return $this->streamCsv(
            'commandes.csv',
            ['Référence', 'Statut', 'Fournisseur', 'Commandé le', 'Livraison prévue', 'Article', 'Qté commandée', 'Qté reçue', 'Reste', 'Prix unitaire', 'Montant'],
            $lignes,
        );
    }

    // ------------------------------------------------------------- Réceptions

    public function receptions(): Response
    {
        $commandes = Commande::with([
            'fournisseur:id,nom',
            'lignes.receptionLignes',
            'receptions.receptionnaire:id,nom,prenom',
            'receptions.lignes.commandeLigne:id,designation,quantite',
        ])
            ->whereIn('statut', ['envoyee', 'confirmee', 'partiellement_recue'])
            ->orderBy('date_livraison_prevue')
            ->get();

        return Inertia::render('logistique/receptions', [
            'commandes' => $commandes->map(fn (Commande $c) => [
                ...$this->ligneCommande($c),
                'lignes' => $c->lignes->map(fn (CommandeLigne $l) => [
                    'id' => $l->id,
                    'designation' => $l->designation,
                    'quantite' => $l->quantite,
                    'quantite_recue' => $l->quantiteRecue(),
                    'quantite_restante' => $l->quantiteRestante(),
                ]),
                'receptions' => $c->receptions->map(fn (Reception $r) => [
                    'id' => $r->id,
                    'date_reception' => $r->date_reception?->toDateString(),
                    'receptionnaire' => $r->receptionnaire
                        ? $r->receptionnaire->prenom.' '.$r->receptionnaire->nom
                        : null,
                    'notes' => $r->notes,
                    'lignes' => $r->lignes->map(fn (ReceptionLigne $rl) => [
                        'designation' => $rl->commandeLigne?->designation ?? '—',
                        'quantite_recue' => $rl->quantite_recue,
                        'conforme' => $rl->conforme,
                        'motif_ecart' => $rl->motif_ecart,
                    ]),
                ]),
            ]),
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom', 'poste']),
        ]);
    }

    public function storeReception(Request $request, Commande $commande): RedirectResponse
    {
        if (! $commande->accepteReception()) {
            return back()->withErrors([
                'commande' => "Une commande « {$commande->statut} » n'attend aucune livraison.",
            ]);
        }

        $data = $request->validate([
            'date_reception' => ['required', 'date'],
            'receptionnaire_employe_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.commande_ligne_id' => ['required', 'integer'],
            'lignes.*.quantite_recue' => ['required', 'integer', 'min:0', 'max:9999'],
            'lignes.*.conforme' => ['required', 'boolean'],
            'lignes.*.motif_ecart' => ['nullable', 'string', 'max:500'],
        ]);

        // Une réception ne portant que des zéros n'est pas une livraison : l'enregistrer
        // ferait basculer la commande en « partiellement reçue » sans que rien ne soit
        // arrivé.
        $lignes = array_values(array_filter($data['lignes'], fn ($l) => $l['quantite_recue'] > 0));

        if ($lignes === []) {
            return back()->withErrors(['lignes' => 'Aucune quantité reçue : rien à enregistrer.']);
        }

        // Les lignes doivent appartenir à CETTE commande — sans quoi une réception
        // pourrait solder la commande d'un autre.
        $lignesCommande = $commande->lignes()->get()->keyBy('id');

        foreach ($lignes as $ligne) {
            if (! $lignesCommande->has($ligne['commande_ligne_id'])) {
                return back()->withErrors(['lignes' => "Une des lignes n'appartient pas à cette commande."]);
            }
        }

        $statutAvant = $commande->statut;

        $reception = DB::transaction(function () use ($commande, $data, $lignes) {
            $reception = Reception::create([
                'commande_id' => $commande->id,
                'receptionnaire_employe_id' => $this->idEmployeCloisonne($data['receptionnaire_employe_id'] ?? null),
                'date_reception' => $data['date_reception'],
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($lignes as $ligne) {
                ReceptionLigne::create([
                    'reception_id' => $reception->id,
                    'commande_ligne_id' => $ligne['commande_ligne_id'],
                    'quantite_recue' => $ligne['quantite_recue'],
                    'conforme' => $ligne['conforme'],
                    'motif_ecart' => $ligne['motif_ecart'] ?? null,
                ]);
            }

            $commande->recalculerStatut();

            return $reception;
        });

        $this->prevenirDesSuitesDeLaReception($commande, $reception, $statutAvant);

        return back();
    }

    /**
     * Les deux notifications que produit une livraison (Phase 12), envoyées APRÈS la
     * transaction : une notification part chez le destinataire et ne se rembobine pas, la
     * poster depuis l'intérieur signifierait annoncer une livraison qu'un échec ultérieur
     * effacerait.
     */
    private function prevenirDesSuitesDeLaReception(Commande $commande, Reception $reception, string $statutAvant): void
    {
        $destinataires = Destinataires::pourRole('logistique', $commande->entreprise_id);

        if ($destinataires->isEmpty()) {
            return;
        }

        // L'écart est le verdict du modèle, jamais rejoué ici — et une seule notification
        // pour toute la livraison : un camion arrivé avec trois articles douteux est un
        // seul problème, pas trois.
        $ecarts = $reception->lignes()->with('commandeLigne')->get()
            ->filter(fn (ReceptionLigne $ligne) => $ligne->presenteUnEcart());

        if ($ecarts->isNotEmpty()) {
            $reception->setRelation('commande', $commande);
            Notification::send($destinataires, new EcartReception($reception, $ecarts));
        }

        // Sur le PASSAGE à « reçue » seulement : comparer au statut d'avant évite de
        // renotifier si une réception à zéro nouvelle quantité était rejouée sur une
        // commande déjà soldée.
        if ($commande->fresh()?->statut === 'recue' && $statutAvant !== 'recue') {
            $commande->load(['fournisseur', 'lignes']);
            Notification::send($destinataires, new CommandeRecue($commande));
        }
    }

    // ---------------------------------------------------------- Enregistrement

    public function enregistrement(): Response
    {
        $lignes = ReceptionLigne::aEnregistrer()
            ->with([
                'commandeLigne:id,designation,quantite,prix_unitaire',
                'reception:id,commande_id,date_reception',
                'reception.commande:id,reference,fournisseur_id',
                'reception.commande.fournisseur:id,nom',
            ])
            ->orderBy('id')
            ->get();

        return Inertia::render('logistique/enregistrement', [
            'lignes' => $lignes->map(fn (ReceptionLigne $l) => [
                'id' => $l->id,
                'designation' => $l->commandeLigne?->designation ?? '—',
                'quantite_recue' => $l->quantite_recue,
                'quantite_enregistree' => $l->quantite_enregistree,
                'reste' => $l->resteAEnregistrer(),
                'conforme' => $l->conforme,
                'motif_ecart' => $l->motif_ecart,
                'date_reception' => $l->reception?->date_reception?->toDateString(),
                'commande' => $l->reception?->commande?->reference,
                'fournisseur' => $l->reception?->commande?->fournisseur?->nom,
                'prix_unitaire' => (float) ($l->commandeLigne?->prix_unitaire ?? 0),
            ]),
        ]);
    }

    /**
     * Fait entrer au parc ce qui a été livré : une ligne de réception devient N
     * `Equipement` au statut `stock`.
     *
     * Un équipement par pièce, et non une ligne portant une quantité : c'est la Phase 05
     * qui suit ensuite chacun d'eux individuellement — numéro de série, garantie, contrat,
     * pannes, réforme. Une ligne « 3 climatiseurs » ne saurait pas dire lequel est tombé
     * en panne.
     */
    public function enregistrer(Request $request, ReceptionLigne $ligne): RedirectResponse
    {
        $reste = $ligne->resteAEnregistrer();

        if ($reste <= 0) {
            return back()->withErrors(['ligne' => 'Cette livraison est déjà entièrement enregistrée.']);
        }

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'quantite' => ['required', 'integer', 'min:1', 'max:'.$reste],
            'numeros_serie' => ['nullable', 'array'],
            'numeros_serie.*' => ['nullable', 'string', 'max:255'],
            'date_achat' => ['nullable', 'date'],
            'garantie_fin' => ['nullable', 'date'],
            'contrat_maintenance' => ['required', 'boolean'],
            'contrat_reference' => ['nullable', 'string', 'max:255'],
            'contrat_echeance' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($ligne, $data) {
            for ($i = 0; $i < $data['quantite']; $i++) {
                Equipement::create([
                    'nom' => $data['nom'],
                    'type' => $data['type'],
                    'statut' => 'stock',
                    'numero_serie' => $data['numeros_serie'][$i] ?? null,
                    'date_achat' => $data['date_achat'] ?? null,
                    'garantie_fin' => $data['garantie_fin'] ?? null,
                    'contrat_maintenance' => $data['contrat_maintenance'],
                    'contrat_reference' => $data['contrat_maintenance'] ? ($data['contrat_reference'] ?? null) : null,
                    'contrat_echeance' => $data['contrat_maintenance'] ? ($data['contrat_echeance'] ?? null) : null,
                    'reception_ligne_id' => $ligne->id,
                ]);
            }

            $ligne->increment('quantite_enregistree', $data['quantite']);
        });

        return back();
    }

    // ------------------------------------------------------------- Affectation

    public function affectation(): Response
    {
        return Inertia::render('logistique/affectation', [
            'equipements' => $this->equipementsDuPole()
                ->with(['appartement:id,numero', 'employe:id,nom,prenom', 'receptionLigne.reception.commande:id,reference'])
                ->orderByDesc('id')
                ->get()
                ->map(fn (Equipement $e) => [
                    'id' => $e->id,
                    'nom' => $e->nom,
                    'type' => $e->type,
                    'statut' => $e->statut,
                    'numero_serie' => $e->numero_serie,
                    'date_achat' => $e->date_achat?->toDateString(),
                    'garantie_fin' => $e->garantie_fin?->toDateString(),
                    'sous_garantie' => $e->estSousGarantie(),
                    'appartement' => $e->appartement ? ['id' => $e->appartement->id, 'numero' => $e->appartement->numero] : null,
                    'employe' => $e->employe ? ['id' => $e->employe->id, 'nom' => $e->employe->nom, 'prenom' => $e->employe->prenom] : null,
                    'commande' => $e->receptionLigne?->reception?->commande?->reference,
                ]),
            'appartements' => Appartement::orderBy('numero')->get(['id', 'numero']),
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom', 'poste']),
        ]);
    }

    public function affecter(Request $request, int $equipement): RedirectResponse
    {
        $piece = $this->equipementsDuPole()->whereKey($equipement)->firstOrFail();

        $data = $request->validate([
            'cible' => ['required', 'in:appartement,employe,stock'],
            'appartement_id' => ['nullable', 'integer'],
            'employe_id' => ['nullable', 'integer'],
        ]);

        if (in_array($piece->statut, ['en_panne', 'reforme'], true)) {
            return back()->withErrors([
                'equipement' => "Un équipement « {$piece->statut} » ne se réaffecte pas depuis cet écran : il relève de la Maintenance.",
            ]);
        }

        // Une seule destination à la fois. Un équipement posé dans un appartement ET
        // remis à un employé ne dirait plus où il se trouve.
        $attributs = match ($data['cible']) {
            'appartement' => [
                'appartement_id' => $this->idAppartementCloisonne($data['appartement_id'] ?? null, obligatoire: true),
                'employe_id' => null,
                'statut' => 'affecte',
            ],
            'employe' => [
                'appartement_id' => null,
                'employe_id' => $this->idEmployeCloisonne($data['employe_id'] ?? null, obligatoire: true),
                'statut' => 'affecte',
            ],
            'stock' => ['appartement_id' => null, 'employe_id' => null, 'statut' => 'stock'],
        };

        $piece->update($attributs);

        return back();
    }

    // ------------------------------------------------------------------ Outils

    /**
     * L'inventaire du pôle : seulement l'équipement ENTRÉ PAR LA CHAÎNE.
     *
     * `equipements` n'a pas de scope d'entreprise (voir l'en-tête du modèle) et mélange
     * deux populations. Les lignes au statut `stock` qui préexistent à cette phase sont en
     * réalité le CATALOGUE d'agréments montré au client sur le portail — « Wifi »,
     * « Climatisation » —, pas du stock physique. Les proposer à l'affectation reviendrait
     * à laisser poser une ligne de catalogue dans un appartement, et à les exposer à toutes
     * les entreprises.
     *
     * Le rattachement à une ligne de réception fait donc double office : il borne
     * l'inventaire à ce que la Logistique a réellement acheté, et il le cloisonne, la
     * chaîne complète remontant jusqu'à `commandes.entreprise_id`.
     */
    private function equipementsDuPole()
    {
        return Equipement::query()->whereHas('receptionLigne.reception.commande');
    }

    private function idAppartementCloisonne(?int $id, bool $obligatoire = false): ?int
    {
        if ($id === null) {
            abort_if($obligatoire, 422, 'Aucun appartement choisi.');

            return null;
        }

        return Appartement::findOrFail($id)->id;
    }

    private function idEmployeCloisonne(?int $id, bool $obligatoire = false): ?int
    {
        if ($id === null) {
            abort_if($obligatoire, 422, 'Aucun employé choisi.');

            return null;
        }

        return Employe::findOrFail($id)->id;
    }

    /** @return array<string, mixed> */
    private function ligneBesoin(Besoin $besoin): array
    {
        return [
            'id' => $besoin->id,
            'designation' => $besoin->designation,
            'quantite' => $besoin->quantite,
            'justification' => $besoin->justification,
            'priorite' => $besoin->priorite,
            'statut' => $besoin->statut,
            'motif_refus' => $besoin->motif_refus,
            'date_validation' => $besoin->date_validation?->toDateString(),
            'created_at' => $besoin->created_at?->toIso8601String(),
            'demandeur' => $besoin->demandeur
                ? ['id' => $besoin->demandeur->id, 'nom' => $besoin->demandeur->nom, 'prenom' => $besoin->demandeur->prenom]
                : null,
            'valideur' => $besoin->valideur
                ? ['id' => $besoin->valideur->id, 'nom' => $besoin->valideur->nom, 'prenom' => $besoin->valideur->prenom]
                : null,
            'appartement' => $besoin->appartement
                ? ['id' => $besoin->appartement->id, 'numero' => $besoin->appartement->numero]
                : null,
            // Les transitions autorisées viennent du modèle : l'écran affiche ce que le
            // serveur permet, il ne rejoue jamais la règle.
            'transitions' => Besoin::TRANSITIONS[$besoin->statut] ?? [],
        ];
    }

    /** @return array<string, mixed> */
    private function ligneCommande(Commande $commande): array
    {
        return [
            'id' => $commande->id,
            'reference' => $commande->reference,
            'statut' => $commande->statut,
            'date_commande' => $commande->date_commande?->toDateString(),
            'date_livraison_prevue' => $commande->date_livraison_prevue?->toDateString(),
            'notes' => $commande->notes,
            'montant_total' => $commande->montantTotal(),
            'fournisseur' => $commande->fournisseur
                ? ['id' => $commande->fournisseur->id, 'nom' => $commande->fournisseur->nom]
                : null,
            'nb_lignes' => $commande->lignes->count(),
            'transitions' => Commande::TRANSITIONS[$commande->statut] ?? [],
            'accepte_reception' => $commande->accepteReception(),
        ];
    }
}
