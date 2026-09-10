<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\CommandeLigne;
use App\Models\Depense;
use App\Models\Employe;
use App\Models\Facture;
use App\Models\FactureFournisseur;
use App\Models\FactureFournisseurLigne;
use App\Models\Fournisseur;
use App\Models\Paiement;
use App\Models\Relance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Les écrans de la Comptabilité avancée (Phase 06) : Factures fournisseur, Entrées,
 * Sorties, Recouvrements et États financiers.
 *
 * Deux couples se ressemblent sans se confondre, et c'est le cœur de ce contrôleur :
 *
 *   - **Facture fournisseur** = l'engagement (le document reçu). **Sortie** = le
 *     décaissement qu'il provoque une fois réglé. L'un cause l'autre ; les additionner
 *     compterait deux fois le même argent.
 *   - **Sortie** = la trésorerie (tout ce qui sort). **Dépense** = le résultat (les
 *     charges seules). Un climatiseur réglé 500 000 est une sortie de 500 000 et une
 *     charge de 0.
 *
 * Même règle de cloisonnement que `LogistiqueController` : tout identifiant venu d'une
 * requête est résolu par une requête SCOPÉE, jamais par `exists:table,id` — cette règle
 * ignore les global scopes et laisserait rattacher une facture au fournisseur d'une autre
 * entreprise.
 *
 * Et une règle propre à ce pôle : **aucune dépense n'est écrite ici à la main pour une
 * facture fournisseur**. C'est `FactureFournisseur::payer()` qui les produit, parce que la
 * décision de ce qui devient une charge appartient au modèle — seules les lignes de nature
 * `charge` en génèrent une, l'immobilisation restant à l'actif.
 */
class ComptabiliteController extends Controller
{
    // ----------------------------------------------------------------- Achats

    public function achats(Request $request): Response
    {
        $filtres = $request->validate([
            'statut' => ['nullable', 'in:'.implode(',', FactureFournisseur::STATUTS)],
            'fournisseur_id' => ['nullable', 'integer'],
        ]);

        $factures = FactureFournisseur::with(['fournisseur:id,nom', 'commande:id,reference', 'valideur:id,nom,prenom', 'lignes'])
            ->when($filtres['statut'] ?? null, fn ($q, $s) => $q->where('statut', $s))
            ->when($filtres['fournisseur_id'] ?? null, fn ($q, $id) => $q->where('fournisseur_id', $id))
            ->orderByDesc('date_facture')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('comptabilite/achats', [
            'factures' => $factures->map(fn (FactureFournisseur $f) => $this->ligneAchat($f)),
            'fournisseurs' => Fournisseur::where('actif', true)->orderBy('nom')->get(['id', 'nom']),
            'commandes_facturables' => $this->commandesFacturables(),
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom', 'poste']),
            'categories' => FactureFournisseurLigne::CATEGORIES,
            'filters' => $filtres,
        ]);
    }

    /**
     * Les commandes dont il reste quelque chose à facturer, avec de quoi pré-remplir.
     *
     * Pré-remplies sur les quantités **REÇUES** et non commandées : c'est ce que le
     * fournisseur est censé facturer. Partir du bon de commande donnerait un total juste
     * seulement quand la livraison a été complète, et masquerait précisément le cas qu'on
     * veut voir — le fournisseur qui facture trois articles quand deux sont arrivés.
     *
     * Une commande n'est pas retirée de la liste après une première facture : une
     * livraison en deux fois se facture couramment en deux fois.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function commandesFacturables()
    {
        return Commande::whereIn('statut', ['partiellement_recue', 'recue'])
            ->with(['fournisseur:id,nom', 'lignes.receptionLignes.equipements:id,reception_ligne_id'])
            ->orderByDesc('date_commande')
            ->get()
            ->map(fn (Commande $c) => [
                'id' => $c->id,
                'reference' => $c->reference,
                'statut' => $c->statut,
                'date_commande' => $c->date_commande?->toDateString(),
                'fournisseur' => $c->fournisseur ? ['id' => $c->fournisseur->id, 'nom' => $c->fournisseur->nom] : null,
                'lignes' => $c->lignes->map(fn (CommandeLigne $l) => [
                    'commande_ligne_id' => $l->id,
                    'designation' => $l->designation,
                    'quantite_commandee' => $l->quantite,
                    // La quantité à facturer par défaut : ce qui est réellement arrivé.
                    'quantite' => $l->quantiteRecue(),
                    'prix_unitaire' => (float) $l->prix_unitaire,
                    'nature' => $this->natureProbable($l),
                ])->values(),
            ]);
    }

    /**
     * Devine la nature comptable d'une ligne de commande.
     *
     * Le seul indice fiable est déjà en base : si la livraison a produit des `Equipement`,
     * c'est un bien durable — numéro de série, garantie, réforme — donc une
     * immobilisation. Sinon on suppose une charge, qui est le cas majoritaire.
     *
     * C'est une PROPOSITION, pas une décision : l'écran laisse corriger ligne par ligne.
     * Deviner faux sans pouvoir corriger fausserait le compte de résultat en silence.
     */
    private function natureProbable(CommandeLigne $ligne): string
    {
        $aProduitDesEquipements = $ligne->receptionLignes
            ->contains(fn ($receptionLigne) => $receptionLigne->equipements->isNotEmpty());

        return $aProduitDesEquipements ? 'immobilisation' : 'charge';
    }

    public function storeAchat(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'fournisseur_id' => ['required', 'integer'],
            'commande_id' => ['nullable', 'integer'],
            'reference' => ['nullable', 'string', 'max:255'],
            'date_facture' => ['required', 'date'],
            'date_echeance' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.commande_ligne_id' => ['nullable', 'integer'],
            'lignes.*.designation' => ['required', 'string', 'max:255'],
            'lignes.*.quantite' => ['required', 'integer', 'min:1', 'max:99999'],
            'lignes.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
            'lignes.*.nature' => ['required', 'in:'.implode(',', FactureFournisseurLigne::NATURES)],
            'lignes.*.categorie' => ['nullable', 'in:'.implode(',', FactureFournisseurLigne::CATEGORIES)],
        ]);

        $fournisseur = Fournisseur::findOrFail($data['fournisseur_id']);
        $commande = isset($data['commande_id']) ? Commande::find($data['commande_id']) : null;

        DB::transaction(function () use ($data, $fournisseur, $commande) {
            $facture = FactureFournisseur::create([
                'fournisseur_id' => $fournisseur->id,
                'commande_id' => $commande?->id,
                'reference' => $data['reference'] ?? null,
                'date_facture' => $data['date_facture'],
                'date_echeance' => $data['date_echeance'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            // Les lignes de commande citées doivent appartenir à la commande retenue —
            // sinon une facture pourrait se rattacher au bon de commande d'un autre.
            $lignesAutorisees = $commande?->lignes()->pluck('id')->all() ?? [];

            foreach ($data['lignes'] as $ligne) {
                $commandeLigneId = $ligne['commande_ligne_id'] ?? null;

                FactureFournisseurLigne::create([
                    'facture_fournisseur_id' => $facture->id,
                    'commande_ligne_id' => in_array($commandeLigneId, $lignesAutorisees, true) ? $commandeLigneId : null,
                    'designation' => $ligne['designation'],
                    'quantite' => $ligne['quantite'],
                    'prix_unitaire' => $ligne['prix_unitaire'],
                    'nature' => $ligne['nature'],
                    // Une immobilisation n'est pas une charge : elle n'a pas de famille de
                    // charge, quoi que le formulaire ait pu envoyer.
                    'categorie' => $ligne['nature'] === 'charge' ? ($ligne['categorie'] ?? 'autres') : null,
                ]);
            }
        });

        return back();
    }

    public function changerStatutAchat(Request $request, FactureFournisseur $achat): RedirectResponse
    {
        $data = $request->validate([
            'statut' => ['required', 'in:validee,a_valider,annulee'],
            'motif' => ['nullable', 'string', 'max:2000'],
        ]);

        if (! $achat->peutPasserA($data['statut'])) {
            return back()->withErrors([
                'statut' => "Passage impossible de « {$achat->statut} » à « {$data['statut']} ».",
            ]);
        }

        match ($data['statut']) {
            'validee' => $achat->valider($request->user()->employe?->id),
            'a_valider' => $achat->renvoyerEnValidation($data['motif'] ?? null),
            'annulee' => $achat->annuler($data['motif'] ?? null),
        };

        return back();
    }

    /**
     * Règle la facture. C'est ce geste — et lui seul — qui inscrit les charges au journal
     * des dépenses ; le contrôleur ne fait qu'appeler le modèle.
     */
    public function payerAchat(Request $request, FactureFournisseur $achat): RedirectResponse
    {
        if (! $achat->peutPasserA('payee')) {
            return back()->withErrors([
                'statut' => "Seule une facture validée peut être réglée (celle-ci est « {$achat->statut} »).",
            ]);
        }

        $data = $request->validate([
            'date_paiement' => ['required', 'date'],
            'mode_paiement' => ['nullable', 'in:especes,virement,mobile_money,cheque'],
            'reference_paiement' => ['nullable', 'string', 'max:255'],
        ]);

        $achat->payer(
            $data['date_paiement'],
            $data['mode_paiement'] ?? null,
            $data['reference_paiement'] ?? null,
        );

        return back();
    }

    public function destroyAchat(FactureFournisseur $achat): RedirectResponse
    {
        if ($achat->statut === 'payee') {
            return back()->withErrors([
                'facture' => 'Une facture réglée ne se supprime pas : elle a produit des écritures.',
            ]);
        }

        $achat->delete();

        return back();
    }

    // ---------------------------------------------------------------- Entrées

    /**
     * Le livre des encaissements — tout ce qui entre en caisse, en un seul endroit.
     *
     * Jusqu'ici l'argent qui rentre se lisait à DEUX endroits : « Consultation Devis »
     * pour les règlements de facture, « Avances reçues » pour les acomptes perçus au
     * portail. Deux écrans pour une seule question.
     *
     * Source unique : la table `paiements`. Pas de double comptage possible — un acompte
     * perçu à la réservation puis rattaché à la facture reste UNE seule ligne, car
     * `FactureController::generer()` renseigne `facture_id` sur la ligne existante au lieu
     * d'en créer une seconde.
     *
     * Écran en LECTURE SEULE : l'encaissement se saisit depuis la facture
     * (`PaiementController::store`) et l'avance vient du portail. Ouvrir une seconde voie
     * de saisie ici donnerait deux chemins pour un même geste.
     */
    public function entrees(Request $request): Response
    {
        $filtres = $request->validate([
            'mode_paiement' => ['nullable', 'in:cb,especes,virement,mobile_money,paypal'],
            'du' => ['nullable', 'date'],
            'au' => ['nullable', 'date'],
        ]);

        $paiements = Paiement::with([
            'facture:id,sejour_id,numero_facture',
            'facture.sejour.reservation.client:id,nom,prenom',
            'reservation.client:id,nom,prenom',
            'reservation.appartement:id,numero',
        ])
            ->when($filtres['mode_paiement'] ?? null, fn ($q, $m) => $q->where('mode_paiement', $m))
            ->when($filtres['du'] ?? null, fn ($q, $d) => $q->whereDate('date_paiement', '>=', $d))
            ->when($filtres['au'] ?? null, fn ($q, $a) => $q->whereDate('date_paiement', '<=', $a))
            ->orderByDesc('date_paiement')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('comptabilite/entrees', [
            'entrees' => $paiements->map(fn (Paiement $p) => [
                'id' => $p->id,
                'montant' => (float) $p->montant,
                'mode_paiement' => $p->mode_paiement,
                'date_paiement' => $p->date_paiement?->toDateString(),
                'reference' => $p->reference_transaction,
                // L'origine dit d'où vient l'argent, pas dans quel écran il a été saisi :
                // une avance rattachée à une facture reste une avance.
                'origine' => $p->reservation_id !== null ? 'avance' : 'facture',
                'rattachee' => $p->reservation_id !== null && $p->facture_id !== null,
                'numero_facture' => $p->facture?->numero_facture,
                'client' => $this->nomClientDuPaiement($p),
                'appartement' => $p->reservation?->appartement?->numero,
            ]),
            'total' => (float) $paiements->sum('montant'),
            'par_mode' => $paiements->groupBy('mode_paiement')
                ->map(fn ($groupe, $mode) => ['mode' => (string) $mode, 'total' => (float) $groupe->sum('montant')])
                ->sortByDesc('total')
                ->values(),
            'filters' => $filtres,
        ]);
    }

    private function nomClientDuPaiement(Paiement $paiement): ?string
    {
        $client = $paiement->reservation?->client
            ?? $paiement->facture?->sejour?->reservation?->client;

        return $client ? trim($client->nom.' '.$client->prenom) : null;
    }

    // ---------------------------------------------------------------- Sorties

    /**
     * Le livre des décaissements — tout ce qui quitte la caisse.
     *
     * **Ce n'est PAS la table `depenses`**, et c'est toute la raison d'être de cet écran.
     * Une dépense est une CHARGE : les immobilisations en sont délibérément absentes
     * (voir `FactureFournisseur::genererDepenses`). Alimenter une vue de trésorerie avec
     * cette table afficherait 60 000 FCFA sortis quand 560 000 ont réellement quitté la
     * caisse. Charge et sortie de caisse sont deux lectures différentes du même fait.
     *
     * La somme se compose donc de deux gisements DISJOINTS :
     *
     *   règlements de factures fournisseur  → le montant TOTAL, immobilisations comprises
     * + dépenses de SAISIE DIRECTE          → ce qui n'a jamais eu de facture
     *
     * Les dépenses issues d'une facture sont exclues : leur montant est déjà compté dans
     * le total de cette facture. C'est cette exclusion qui empêche le double comptage.
     *
     * La liste est au niveau du MOUVEMENT et non de la ligne comptable : un livre de
     * caisse a une ligne par règlement. La ventilation charge/immobilisation vit dans la
     * synthèse, où elle réconcilie cet écran avec les états financiers.
     */
    public function sorties(Request $request): Response
    {
        $filtres = $request->validate([
            'origine' => ['nullable', 'in:facture,saisie_directe'],
            'du' => ['nullable', 'date'],
            'au' => ['nullable', 'date'],
        ]);

        $du = $filtres['du'] ?? null;
        $au = $filtres['au'] ?? null;
        $origine = $filtres['origine'] ?? null;

        $reglements = $origine === 'saisie_directe'
            ? collect()
            : FactureFournisseur::where('statut', 'payee')
                ->with(['fournisseur:id,nom', 'lignes'])
                ->when($du, fn ($q, $d) => $q->whereDate('date_paiement', '>=', $d))
                ->when($au, fn ($q, $a) => $q->whereDate('date_paiement', '<=', $a))
                ->get()
                ->map(fn (FactureFournisseur $f) => [
                    'cle' => 'facture-'.$f->id,
                    'origine' => 'facture',
                    'libelle' => $f->reference ?? 'Facture fournisseur',
                    'tiers' => $f->fournisseur?->nom,
                    'montant' => $f->montantTotal(),
                    'montant_charges' => $f->montantCharges(),
                    'montant_immobilise' => $f->montantImmobilise(),
                    'date' => $f->date_paiement?->toDateString(),
                    'mode_paiement' => $f->mode_paiement,
                    'reference' => $f->reference_paiement,
                    'categorie' => null,
                    'facture_fournisseur_id' => $f->id,
                    'depense_id' => null,
                ]);

        $saisies = $origine === 'facture'
            ? collect()
            : Depense::whereNull('facture_fournisseur_ligne_id')
                ->with('valideur:id,nom,prenom')
                ->surPeriode($du, $au)
                ->get()
                ->map(fn (Depense $d) => [
                    'cle' => 'depense-'.$d->id,
                    'origine' => 'saisie_directe',
                    'libelle' => $d->libelle,
                    'tiers' => $d->valideur ? $d->valideur->prenom.' '.$d->valideur->nom : null,
                    'montant' => (float) $d->montant,
                    // Une saisie directe est toujours une charge : on n'immobilise pas
                    // sans facture.
                    'montant_charges' => (float) $d->montant,
                    'montant_immobilise' => 0.0,
                    'date' => $d->date_depense?->toDateString(),
                    'mode_paiement' => null,
                    'reference' => null,
                    'categorie' => $d->categorie,
                    'facture_fournisseur_id' => null,
                    'depense_id' => $d->id,
                ]);

        $mouvements = $reglements->concat($saisies)
            ->sortByDesc(fn (array $m) => $m['date'] ?? '')
            ->values();

        return Inertia::render('comptabilite/sorties', [
            'sorties' => $mouvements,
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom', 'poste']),
            'categories' => Depense::CATEGORIES,
            'synthese' => [
                'total' => (float) $mouvements->sum('montant'),
                'charges' => (float) $mouvements->sum('montant_charges'),
                'immobilise' => (float) $mouvements->sum('montant_immobilise'),
            ],
            'filters' => $filtres,
        ]);
    }

    public function storeDepense(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'libelle' => ['required', 'string', 'max:255'],
            'montant' => ['required', 'numeric', 'min:0'],
            'date_depense' => ['required', 'date'],
            'categorie' => ['required', 'in:'.implode(',', Depense::CATEGORIES)],
            'valideur_id' => ['nullable', 'integer'],
        ]);

        Depense::create([
            ...$data,
            'valideur_id' => isset($data['valideur_id']) ? Employe::findOrFail($data['valideur_id'])->id : null,
        ]);

        return back();
    }

    /**
     * Une dépense issue d'une facture fournisseur n'est PAS modifiable ici : elle est le
     * reflet d'une écriture, la corriger sans toucher la facture ferait diverger les deux.
     */
    public function updateDepense(Request $request, Depense $depense): RedirectResponse
    {
        if (! $depense->estSaisieDirecte()) {
            return back()->withErrors([
                'depense' => 'Cette dépense vient d\'une facture fournisseur : corrigez la facture.',
            ]);
        }

        $data = $request->validate([
            'libelle' => ['required', 'string', 'max:255'],
            'montant' => ['required', 'numeric', 'min:0'],
            'date_depense' => ['required', 'date'],
            'categorie' => ['required', 'in:'.implode(',', Depense::CATEGORIES)],
            'valideur_id' => ['nullable', 'integer'],
        ]);

        $depense->update([
            ...$data,
            'valideur_id' => isset($data['valideur_id']) ? Employe::findOrFail($data['valideur_id'])->id : null,
        ]);

        return back();
    }

    public function destroyDepense(Depense $depense): RedirectResponse
    {
        if (! $depense->estSaisieDirecte()) {
            return back()->withErrors([
                'depense' => 'Cette dépense vient d\'une facture fournisseur : annulez la facture.',
            ]);
        }

        $depense->delete();

        return back();
    }

    // ---------------------------------------------------------- Recouvrements

    public function recouvrements(Request $request): Response
    {
        $filtres = $request->validate([
            'etat' => ['nullable', 'in:en_retard,a_echoir'],
        ]);

        // Une facture validée dont il reste quelque chose à encaisser. `payee` est exclue
        // par construction, `brouillon` n'a jamais été émise, `annulee` ne se recouvre pas.
        $impayees = Facture::where('statut', 'validee')
            ->with(['sejour.reservation.client:id,nom,prenom,email,telephone', 'paiements', 'relances.employe:id,nom,prenom'])
            ->get()
            ->filter(fn (Facture $f) => $f->soldeRestant() > 0)
            ->when(
                ($filtres['etat'] ?? null) !== null,
                fn ($c) => $c->filter(fn (Facture $f) => ($filtres['etat'] === 'en_retard') === $this->estEnRetard($f)),
            )
            // Les plus anciennes d'abord : ce sont elles qui coûtent.
            ->sortBy(fn (Facture $f) => $f->date_echeance?->timestamp ?? PHP_INT_MAX)
            ->values();

        return Inertia::render('comptabilite/recouvrements', [
            'factures' => $impayees->map(fn (Facture $f) => [
                'id' => $f->id,
                'numero_facture' => $f->numero_facture,
                'montant_ttc' => (float) $f->montant_ttc,
                'montant_paye' => $f->montantPaye(),
                'solde_restant' => $f->soldeRestant(),
                'date_edition' => $f->date_edition?->toDateString(),
                'date_echeance' => $f->date_echeance?->toDateString(),
                'jours_de_retard' => $this->joursDeRetard($f),
                'en_retard' => $this->estEnRetard($f),
                'client' => $f->sejour?->reservation?->client
                    ? [
                        'nom' => trim($f->sejour->reservation->client->nom.' '.$f->sejour->reservation->client->prenom),
                        'email' => $f->sejour->reservation->client->email,
                        'telephone' => $f->sejour->reservation->client->telephone,
                    ]
                    : null,
                'relances' => $f->relances->sortByDesc('date_relance')->values()->map(fn (Relance $r) => [
                    'id' => $r->id,
                    'date_relance' => $r->date_relance?->toDateString(),
                    'canal' => $r->canal,
                    'note' => $r->note,
                    'solde_restant' => (float) $r->solde_restant,
                    'employe' => $r->employe ? $r->employe->prenom.' '.$r->employe->nom : null,
                ]),
            ]),
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom', 'poste']),
            'canaux' => Relance::CANAUX,
            'total_du' => (float) $impayees->sum(fn (Facture $f) => $f->soldeRestant()),
            'filters' => $filtres,
        ]);
    }

    public function storeRelance(Request $request, Facture $facture): RedirectResponse
    {
        if ($facture->soldeRestant() <= 0) {
            return back()->withErrors(['relance' => 'Cette facture est soldée : il n\'y a rien à relancer.']);
        }

        $data = $request->validate([
            'date_relance' => ['required', 'date'],
            'canal' => ['required', 'in:'.implode(',', Relance::CANAUX)],
            'note' => ['nullable', 'string', 'max:2000'],
            'employe_id' => ['nullable', 'integer'],
        ]);

        Relance::create([
            'facture_id' => $facture->id,
            'employe_id' => isset($data['employe_id']) ? Employe::findOrFail($data['employe_id'])->id : null,
            'date_relance' => $data['date_relance'],
            'canal' => $data['canal'],
            'note' => $data['note'] ?? null,
            // Figé maintenant : dans trois semaines la facture sera peut-être soldée, et
            // l'historique doit continuer à dire pourquoi on avait relancé.
            'solde_restant' => $facture->soldeRestant(),
        ]);

        return back();
    }

    // ------------------------------------------------------- États financiers

    /**
     * Compte de résultat simplifié : ce qui est réellement entré, moins ce qui est
     * réellement sorti, sur une période.
     *
     * Comptabilité de CAISSE et non d'engagement : on somme les paiements encaissés et les
     * dépenses décaissées, pas les factures émises. C'est ce que veut un exploitant qui se
     * demande si le mois a été bon ; l'engagement se lit sur les deux files d'attente
     * (créances à recouvrer, factures fournisseur à régler), affichées à côté.
     *
     * Les montants IMMOBILISÉS sont sortis du résultat et présentés à part — c'est toute
     * la raison d'être du champ `nature`. Aucun graphique ici : les visualisations sont le
     * périmètre de la Phase 07.
     */
    public function etatsFinanciers(Request $request): Response
    {
        $filtres = $request->validate([
            'du' => ['nullable', 'date'],
            'au' => ['nullable', 'date'],
        ]);

        $du = $filtres['du'] ?? now()->startOfYear()->toDateString();
        $au = $filtres['au'] ?? now()->toDateString();

        // Recettes : les encaissements clients de la période.
        $paiements = Paiement::whereHas('facture')
            ->whereDate('date_paiement', '>=', $du)
            ->whereDate('date_paiement', '<=', $au)
            ->get();

        $depenses = Depense::surPeriode($du, $au)->get();

        $parCategorie = $depenses->groupBy('categorie')
            ->map(fn ($groupe, $categorie) => [
                'categorie' => (string) $categorie,
                'total' => (float) $groupe->sum('montant'),
                'nombre' => $groupe->count(),
            ])
            ->sortByDesc('total')
            ->values();

        // Immobilisations de la période : lignes d'achat durables sur factures réglées.
        $immobilise = (float) FactureFournisseurLigne::immobilisations()
            ->whereHas('factureFournisseur', fn ($q) => $q
                ->where('statut', 'payee')
                ->whereDate('date_paiement', '>=', $du)
                ->whereDate('date_paiement', '<=', $au))
            ->get()
            ->sum(fn (FactureFournisseurLigne $l) => $l->montant());

        $recettes = (float) $paiements->sum('montant');
        $charges = (float) $depenses->sum('montant');

        return Inertia::render('comptabilite/etats-financiers', [
            'periode' => ['du' => $du, 'au' => $au],
            'resultat' => [
                'recettes' => $recettes,
                'charges' => $charges,
                'marge' => $recettes - $charges,
                'immobilise' => $immobilise,
            ],
            'charges_par_categorie' => $parCategorie,
            'recettes_par_mode' => $paiements->groupBy('mode_paiement')
                ->map(fn ($g, $mode) => ['mode' => (string) $mode, 'total' => (float) $g->sum('montant')])
                ->sortByDesc('total')
                ->values(),
            // Les deux files d'engagement, pour que la lecture en caisse ne masque pas ce
            // qui est dû de part et d'autre.
            'engagements' => [
                'creances' => (float) Facture::where('statut', 'validee')->get()
                    ->sum(fn (Facture $f) => $f->soldeRestant()),
                'dettes_fournisseur' => (float) FactureFournisseur::aDue()->with('lignes')->get()
                    ->sum(fn (FactureFournisseur $f) => $f->montantTotal()),
            ],
        ]);
    }

    // ------------------------------------------------------------------ Outils

    private function estEnRetard(Facture $facture): bool
    {
        return $facture->date_echeance !== null && $facture->date_echeance->isPast();
    }

    private function joursDeRetard(Facture $facture): int
    {
        if (! $this->estEnRetard($facture)) {
            return 0;
        }

        return (int) $facture->date_echeance->diffInDays(now());
    }

    /** @return array<string, mixed> */
    private function ligneAchat(FactureFournisseur $facture): array
    {
        return [
            'id' => $facture->id,
            'reference' => $facture->reference,
            'statut' => $facture->statut,
            'date_facture' => $facture->date_facture?->toDateString(),
            'date_echeance' => $facture->date_echeance?->toDateString(),
            'date_paiement' => $facture->date_paiement?->toDateString(),
            'mode_paiement' => $facture->mode_paiement,
            'montant_total' => $facture->montantTotal(),
            'montant_charges' => $facture->montantCharges(),
            'montant_immobilise' => $facture->montantImmobilise(),
            'en_retard' => $facture->estEnRetard(),
            'motif_rejet' => $facture->motif_rejet,
            'notes' => $facture->notes,
            'fournisseur' => $facture->fournisseur ? ['id' => $facture->fournisseur->id, 'nom' => $facture->fournisseur->nom] : null,
            'commande' => $facture->commande?->reference,
            'valideur' => $facture->valideur ? $facture->valideur->prenom.' '.$facture->valideur->nom : null,
            'transitions' => FactureFournisseur::TRANSITIONS[$facture->statut] ?? [],
            'lignes' => $facture->lignes->map(fn (FactureFournisseurLigne $l) => [
                'id' => $l->id,
                'designation' => $l->designation,
                'quantite' => $l->quantite,
                'prix_unitaire' => (float) $l->prix_unitaire,
                'montant' => $l->montant(),
                'nature' => $l->nature,
                'categorie' => $l->categorie,
            ]),
        ];
    }
}
