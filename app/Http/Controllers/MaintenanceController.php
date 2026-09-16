<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Appartement;
use App\Models\Employe;
use App\Models\Equipement;
use App\Models\Intervention;
use App\Models\ParametreMaintenance;
use App\Notifications\Interne\InterventionAffectee;
use App\Support\Destinataires;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Pôle Maintenance (Phase 05, étape B) — les trois écrans du workflow plus leur
 * tableau de bord opérationnel. Le socle (étape A) définit la mécanique : `etape` est
 * la seule colonne persistée, Intervention::TRANSITIONS dit ce qui est autorisé,
 * statutMacro() en dérive la vue R9. Ce contrôleur ne fait que la piloter.
 *
 * Étape C : le test de conformité verrouille désormais la clôture (R5) et la réforme
 * est une issue terminale à part entière (R6) — toutes deux ont leur propre action, la
 * transition générique les refuse explicitement. La garantie et le contrat (R7) vivent
 * sur l'équipement et ont leur propre écran, voir ParcEquipementController.
 */
class MaintenanceController extends Controller
{
    use ExportsCsv;

    /**
     * @var array<int, string>
     */
    private const RELATIONS = [
        'equipement:id,nom,type',
        'appartement:id,numero',
        'declarant:id,nom,prenom',
        'technicien:id,nom,prenom',
    ];

    /**
     * Tableau de bord opérationnel : une file de travail, pas du reporting agrégé —
     * les états financiers et les KPI transverses relèvent de la Phase 07 (décision
     * actée le 2026-08-26, le 6e bloc "Contrôle & reporting" y est entièrement différé).
     */
    public function dashboard(): Response
    {
        $parEtape = Intervention::query()
            ->selectRaw('etape, COUNT(*) as total')
            ->groupBy('etape')
            ->pluck('total', 'etape');

        return Inertia::render('maintenance/dashboard', [
            'kpi' => [
                'a_prendre_en_charge' => Intervention::where('etape', 'signalee')->count(),
                'sla_depasses' => Intervention::horsDelai()->count(),
                'en_reparation' => Intervention::where('etape', 'en_cours')->count(),
                'ouvertes' => Intervention::ouvertes()->count(),
            ],
            'parEtape' => collect(Intervention::ETAPES)
                ->map(fn (string $etape) => ['etape' => $etape, 'total' => (int) ($parEtape[$etape] ?? 0)])
                ->values(),
            // Les plus anciennes d'abord : ce sont elles qui coûtent, pas les dernières arrivées.
            'urgentes' => $this->lignes(
                Intervention::ouvertes()->horsDelai()->orderBy('date_signalement')->limit(8),
            ),
            'parametres' => $this->parametresPourEcran(),
        ]);
    }

    /**
     * Écran 1 — Prise en charge des pannes : tout ce qui n'a pas encore été touché par
     * la maintenance (triage), plus ce qui a été planifié/affecté mais pas démarré.
     */
    public function pannes(Request $request): Response
    {
        $filtres = $request->validate([
            'equipement_id' => ['nullable', 'integer', 'exists:equipements,id'],
            'appartement_id' => ['nullable', 'integer', 'exists:appartements,id'],
            'priorite' => ['nullable', 'in:basse,normale,haute,critique'],
        ]);

        $requete = Intervention::whereIn('etape', ['signalee', 'planifiee', 'technicien_affecte'])
            ->when($filtres['equipement_id'] ?? null, fn ($q, $id) => $q->where('equipement_id', $id))
            ->when($filtres['appartement_id'] ?? null, fn ($q, $id) => $q->where('appartement_id', $id))
            ->when($filtres['priorite'] ?? null, fn ($q, $p) => $q->where('priorite', $p))
            ->orderByRaw("FIELD(priorite, 'critique', 'haute', 'normale', 'basse')")
            ->orderBy('date_signalement');

        return Inertia::render('maintenance/pannes', [
            'interventions' => $this->lignes($requete),
            'techniciens' => $this->techniciens(),
            'parametres' => $this->parametresPourEcran(),
            'appartements' => Appartement::orderBy('numero')->get(['id', 'numero']),
            'equipements' => $this->equipementsAvecPanneOuverte(),
            'filters' => $filtres,
        ]);
    }

    /**
     * Les équipements qui portent au moins une panne encore à traiter — c'est la seule
     * liste utile au filtre de cet écran. Proposer tout le parc laisserait choisir des
     * équipements qui ne peuvent donner aucun résultat.
     *
     * @return array<int, array<string, mixed>>
     */
    private function equipementsAvecPanneOuverte(): array
    {
        return Equipement::whereIn(
            'id',
            Intervention::whereIn('etape', ['signalee', 'planifiee', 'technicien_affecte'])
                ->select('equipement_id'),
        )
            ->orderBy('nom')
            ->get(['id', 'nom'])
            ->map(fn (Equipement $e) => ['id' => $e->id, 'nom' => $e->nom])
            ->all();
    }

    /**
     * Écran 2 — Suivi des interventions : la vue exhaustive, filtrable, exportable.
     * C'est le seul écran qui montre aussi les dossiers fermés.
     */
    public function interventions(Request $request): Response
    {
        $filtres = $request->validate([
            'etape' => ['nullable', 'in:'.implode(',', Intervention::ETAPES)],
            'priorite' => ['nullable', 'in:basse,normale,haute,critique'],
            'sla' => ['nullable', 'in:depasse'],
            // Cible UNE intervention : c'est la destination des notifications qui parlent
            // d'un dossier precis. Cet ecran est le seul qui montre AUSSI les dossiers
            // fermes, donc le seul ou un lien reste valable quoi qu'il advienne du dossier.
            'intervention' => ['nullable', 'integer'],
        ]);

        $requete = Intervention::query()
            ->when($filtres['intervention'] ?? null, fn ($q, $id) => $q->whereKey($id))
            ->when($filtres['etape'] ?? null, fn ($q, $etape) => $q->where('etape', $etape))
            ->when($filtres['priorite'] ?? null, fn ($q, $priorite) => $q->where('priorite', $priorite))
            ->when(($filtres['sla'] ?? null) === 'depasse', fn ($q) => $q->horsDelai())
            ->orderByDesc('date_signalement');

        return Inertia::render('maintenance/interventions', [
            'interventions' => $this->lignes($requete, avecActions: true),
            'techniciens' => $this->techniciens(),
            'parametres' => $this->parametresPourEcran(),
            'filters' => $filtres,
        ]);
    }

    /**
     * Écran 3 — Réparations : le poste de travail du technicien. Uniquement les dossiers
     * réellement en atelier (en cours, réparés en attente de contrôle, contrôlés en
     * attente de clôture) — le triage se fait sur l'écran "Prise en charge".
     */
    public function reparations(): Response
    {
        return Inertia::render('maintenance/reparations', [
            'interventions' => $this->lignes(
                Intervention::whereIn('etape', ['en_cours', 'reparee', 'controlee'])
                    ->orderByRaw("FIELD(priorite, 'critique', 'haute', 'normale', 'basse')")
                    ->orderBy('date_signalement'),
                avecActions: true,
            ),
            'techniciens' => $this->techniciens(),
            'parametres' => $this->parametresPourEcran(),
        ]);
    }

    /**
     * Planifie une date d'intervention. Vaut prise en charge : la maintenance a réagi.
     */
    public function planifier(Request $request, Intervention $intervention): RedirectResponse
    {
        $data = $request->validate([
            'date_planifiee' => ['required', 'date'],
        ]);

        $this->refuserSiTerminee($intervention);

        $intervention->fill(['date_planifiee' => $data['date_planifiee']]);
        if ($intervention->peutPasserA('planifiee')) {
            $intervention->etape = 'planifiee';
        }
        $this->horodaterPriseEnCharge($intervention);
        $intervention->save();

        return back();
    }

    /**
     * Affecte un technicien. Vaut également prise en charge.
     */
    public function affecter(Request $request, Intervention $intervention): RedirectResponse
    {
        $data = $request->validate([
            'technicien_employe_id' => ['required', 'integer'],
        ]);

        // Requete cloisonnee plutot que exists: (qui ignore les global scopes) — un
        // technicien d'une autre entreprise ne doit meme pas etre resolvable ici.
        Employe::findOrFail($data['technicien_employe_id']);

        $this->refuserSiTerminee($intervention);

        $changement = $intervention->technicien_employe_id !== (int) $data['technicien_employe_id'];

        $intervention->fill(['technicien_employe_id' => $data['technicien_employe_id']]);
        if ($intervention->peutPasserA('technicien_affecte')) {
            $intervention->etape = 'technicien_affecte';
        }
        $this->horodaterPriseEnCharge($intervention);
        $intervention->save();

        // Phase 12 : la seule notification adressee a UNE personne plutot qu'a un pole.
        // Conditionnee a un vrai changement, sinon reenregistrer la meme affectation
        // renotifierait le technicien a chaque fois. Le destinataire peut etre vide :
        // tous les employes n'ont pas de compte de connexion.
        if ($changement) {
            Notification::send(
                Destinataires::pourEmploye($intervention->technicien_employe_id),
                new InterventionAffectee($intervention),
            );
        }

        return back();
    }

    /**
     * Prise en charge « sèche » : la maintenance accuse réception sans encore planifier
     * ni affecter. Arrête le compteur SLA (R2), qui mesure le délai de RÉACTION et non
     * le temps de réparation — c'est la seule chose que fait cette action.
     */
    public function prendreEnCharge(Intervention $intervention): RedirectResponse
    {
        $this->refuserSiTerminee($intervention);

        $this->horodaterPriseEnCharge($intervention);
        $intervention->save();

        return back();
    }

    /**
     * Transition générique du workflow. Toute écriture de `etape` passe par ici : la
     * liste des transitions légales vit dans le modèle (Intervention::TRANSITIONS), pas
     * dans une suite de routes spécialisées qui finiraient par diverger.
     */
    public function changerEtape(Request $request, Intervention $intervention): RedirectResponse
    {
        $data = $request->validate([
            'etape' => ['required', 'in:'.implode(',', Intervention::ETAPES)],
        ]);

        if (! $intervention->peutPasserA($data['etape'])) {
            throw ValidationException::withMessages([
                'etape' => "Transition impossible : une intervention {$intervention->etape} ne peut pas passer à {$data['etape']}.",
            ]);
        }

        // R5 / R6 : ces deux etapes exigent une saisie propre. Les laisser passer ici
        // permettrait d'atteindre 'controlee' sans avoir teste quoi que ce soit, ou de
        // reformer un equipement sans motif.
        if (in_array($data['etape'], Intervention::ETAPES_A_SAISIE_DEDIEE, true)) {
            throw ValidationException::withMessages([
                'etape' => $data['etape'] === 'controlee'
                    ? 'Le passage en contrôlé se fait en enregistrant le test de conformité.'
                    : 'La réforme se fait en enregistrant son motif et son coût estimé.',
            ]);
        }

        // R5 : le verrou de cloture. La regle vit dans le modele et renvoie sa raison,
        // pour que l'ecran et l'API disent exactement la meme chose.
        if ($data['etape'] === 'cloturee' && $blocage = $intervention->blocageCloture()) {
            throw ValidationException::withMessages(['etape' => $blocage]);
        }

        DB::transaction(function () use ($intervention, $data, $request) {
            $intervention->etape = $data['etape'];

            // Démarrer une réparation sans technicien nommé rendrait le journal d'actions
            // (R4) inexploitable : à défaut de choix explicite, c'est celui qui démarre.
            if ($data['etape'] === 'en_cours' && ! $intervention->technicien_employe_id) {
                $intervention->technicien_employe_id = $request->user()->employe?->id;
            }

            // date_resolution marque la sortie du parcours actif, quelle qu'en soit
            // l'issue — 'reparee' n'est pas la fin, la clôture l'est.
            if (in_array($data['etape'], Intervention::ETAPES_TERMINALES, true)) {
                $intervention->date_resolution ??= now();
            }

            $this->horodaterPriseEnCharge($intervention);
            $intervention->save();

            $this->repercuterSurEquipement($intervention);
        });

        return back();
    }

    /**
     * R5 — Test de conformité. C'est LUI qui fait passer une intervention réparée à
     * l'étape « contrôlée », jamais la transition générique : sans cela on pourrait
     * atteindre l'étape de contrôle sans avoir rien contrôlé.
     *
     * Un résultat non conforme ne bloque pas le dossier, il le renvoie en réparation —
     * en passant par 'controlee', parce que c'est le chemin que déclare la table des
     * transitions du modèle (reparee -> controlee -> en_cours) et qu'on ne court-circuite
     * pas la garde du workflow pour aller plus vite.
     */
    public function testerConformite(Request $request, Intervention $intervention): RedirectResponse
    {
        $data = $request->validate([
            'resultat' => ['required', 'in:conforme,non_conforme'],
            'commentaire' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->refuserSiTerminee($intervention);

        if (! $intervention->peutPasserA('controlee')) {
            throw ValidationException::withMessages([
                'resultat' => "Seule une intervention réparée peut être contrôlée (celle-ci est à l'étape « {$intervention->etape} »).",
            ]);
        }

        DB::transaction(function () use ($intervention, $data, $request) {
            $intervention->fill([
                'etape' => 'controlee',
                'conformite_resultat' => $data['resultat'],
                'conformite_testee_le' => now(),
                'conformite_employe_id' => $request->user()->employe?->id ?? $intervention->technicien_employe_id,
            ]);
            $intervention->save();

            if ($data['resultat'] === 'non_conforme' && $intervention->peutPasserA('en_cours')) {
                $intervention->update(['etape' => 'en_cours']);
            }

            if ($commentaire = trim((string) ($data['commentaire'] ?? ''))) {
                $intervention->actions()->create([
                    'type' => 'controle',
                    'description' => $commentaire,
                    'effectuee_le' => now(),
                    'cout' => 0,
                ]);
                $intervention->recalculerCout();
            }
        });

        return back();
    }

    /**
     * R6 — Réforme : l'issue terminale alternative. Toutes les pannes ne finissent pas
     * réparées ; au-delà d'un certain coût, ou faute de pièce, on sort le matériel du parc.
     *
     * Le seuil de `parametres_maintenance` n'est volontairement PAS bloquant : la règle
     * dit « coût supérieur au seuil OU pièce indisponible », et le second cas n'a rien à
     * voir avec un montant. L'écran affiche la comparaison, la décision reste humaine —
     * mais le motif, lui, est obligatoire, c'est lui qui rend la décision auditable.
     */
    public function reformer(Request $request, Intervention $intervention): RedirectResponse
    {
        $data = $request->validate([
            'motif_reforme' => ['required', 'string', 'min:10', 'max:2000'],
            'cout_reparation_estime' => ['required', 'numeric', 'min:0'],
        ]);

        $this->refuserSiTerminee($intervention);

        if (! $intervention->peutPasserA('reformee')) {
            throw ValidationException::withMessages([
                'motif_reforme' => "Une intervention ne peut être réformée que depuis l'étape « en cours » (celle-ci est à l'étape « {$intervention->etape} »).",
            ]);
        }

        DB::transaction(function () use ($intervention, $data) {
            $intervention->fill([
                ...$data,
                'etape' => 'reformee',
                'date_resolution' => now(),
            ]);
            $this->horodaterPriseEnCharge($intervention);
            $intervention->save();

            $this->repercuterSurEquipement($intervention);
        });

        return back();
    }

    /**
     * Export CSV du suivi (mêmes filtres que l'écran, plus la plage de dates commune
     * à tous les exports du projet).
     */
    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'etape' => ['nullable', 'in:'.implode(',', Intervention::ETAPES)],
            'priorite' => ['nullable', 'in:basse,normale,haute,critique'],
            'sla' => ['nullable', 'in:depasse'],
        ]);

        $interventions = Intervention::with(self::RELATIONS)
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('date_signalement', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('date_signalement', '<=', $to))
            ->when($data['etape'] ?? null, fn ($q, $etape) => $q->where('etape', $etape))
            ->when($data['priorite'] ?? null, fn ($q, $priorite) => $q->where('priorite', $priorite))
            ->when(($data['sla'] ?? null) === 'depasse', fn ($q) => $q->horsDelai())
            ->orderByDesc('date_signalement')
            ->get();

        return $this->streamCsv(
            'interventions-maintenance.csv',
            [
                'ID', 'Appartement', 'Équipement', 'Panne', 'Priorité', 'Étape', 'Statut macro',
                'Technicien', 'Signalée le', 'Échéance SLA', 'Prise en charge le', 'SLA dépassé',
                'Temps passé (min)', 'Coût total', 'Sous garantie',
            ],
            $interventions->map(fn (Intervention $i) => [
                $i->id,
                $i->appartement?->numero,
                $i->equipement?->nom,
                $i->description_panne,
                $i->priorite,
                $i->etape,
                $i->statutMacro(),
                $i->technicien ? "{$i->technicien->prenom} {$i->technicien->nom}" : null,
                $i->date_signalement?->format('d/m/Y H:i'),
                $i->sla_echeance?->format('d/m/Y H:i'),
                $i->date_prise_en_charge?->format('d/m/Y H:i'),
                $i->slaDepasse() ? 'oui' : 'non',
                $i->actions->sum('temps_passe_minutes'),
                $i->cout_total,
                $i->sous_garantie ? 'oui' : 'non',
            ]),
        );
    }

    /**
     * Sérialisation commune aux quatre écrans : slaDepasse() et statutMacro() sont des
     * méthodes PHP, elles ne traversent pas Inertia toutes seules.
     *
     * @param  Builder<Intervention>  $requete
     * @return array<int, array<string, mixed>>
     */
    private function lignes($requete, bool $avecActions = false): array
    {
        $relations = self::RELATIONS;
        if ($avecActions) {
            $relations[] = 'actions';
        }

        return $requete->with($relations)->get()->map(function (Intervention $i) use ($avecActions) {
            $ligne = [
                'id' => $i->id,
                'description_panne' => $i->description_panne,
                'priorite' => $i->priorite,
                'etape' => $i->etape,
                'statut_macro' => $i->statutMacro(),
                'date_signalement' => $i->date_signalement?->toIso8601String(),
                'date_planifiee' => $i->date_planifiee?->toIso8601String(),
                'date_prise_en_charge' => $i->date_prise_en_charge?->toIso8601String(),
                'sla_echeance' => $i->sla_echeance?->toIso8601String(),
                'date_resolution' => $i->date_resolution?->toIso8601String(),
                'sla_depasse' => $i->slaDepasse(),
                'sous_garantie' => (bool) $i->sous_garantie,
                'cout_total' => (float) $i->cout_total,
                'conformite_resultat' => $i->conformite_resultat,
                'conformite_testee_le' => $i->conformite_testee_le?->toIso8601String(),
                'motif_reforme' => $i->motif_reforme,
                'cout_reparation_estime' => $i->cout_reparation_estime === null ? null : (float) $i->cout_reparation_estime,
                // La raison du refus de cloture voyage avec la ligne : l'ecran affiche
                // exactement le message que l'API renverrait, sans reecrire la regle.
                'blocage_cloture' => $i->blocageCloture(),
                'transitions' => Intervention::TRANSITIONS[$i->etape] ?? [],
                'equipement' => $i->equipement ? ['id' => $i->equipement->id, 'nom' => $i->equipement->nom, 'type' => $i->equipement->type] : null,
                'appartement' => $i->appartement ? ['id' => $i->appartement->id, 'numero' => $i->appartement->numero] : null,
                'declarant' => $i->declarant ? ['id' => $i->declarant->id, 'nom' => $i->declarant->nom, 'prenom' => $i->declarant->prenom] : null,
                'technicien' => $i->technicien ? ['id' => $i->technicien->id, 'nom' => $i->technicien->nom, 'prenom' => $i->technicien->prenom] : null,
            ];

            if ($avecActions) {
                $ligne['actions'] = $i->actions
                    ->sortByDesc('effectuee_le')
                    ->values()
                    ->map(fn ($action) => [
                        'id' => $action->id,
                        'type' => $action->type,
                        'description' => $action->description,
                        'temps_passe_minutes' => $action->temps_passe_minutes,
                        'piece_libelle' => $action->piece_libelle,
                        'piece_quantite' => $action->piece_quantite,
                        'cout' => (float) $action->cout,
                        'effectuee_le' => $action->effectuee_le?->toIso8601String(),
                    ]);
            }

            return $ligne;
        })->all();
    }

    /**
     * Les employés proposables à l'affectation : uniquement les techniciens du pôle
     * (voir Employe::MOTSCLES_POSTE_MAINTENANCE), et uniquement les actifs. Avant, tout
     * employé actif était proposé — un réceptionniste pouvait être affecté à une panne.
     *
     * Ce filtre à lui seul n'est qu'une aide à la saisie, pas un contrôle d'accès — c'est
     * `Employe::findOrFail()` dans `affecter()` qui empêche réellement une requête forgée
     * de pointer vers un employé d'une autre entreprise (Phase 08, 2026-09-16).
     *
     * @return array<int, array<string, mixed>>
     */
    private function techniciens(): array
    {
        return Employe::where('actif', true)
            ->techniciensMaintenance()
            ->orderBy('nom')
            ->get(['id', 'nom', 'prenom', 'poste'])
            ->map(fn (Employe $e) => ['id' => $e->id, 'nom' => $e->nom, 'prenom' => $e->prenom, 'poste' => $e->poste])
            ->all();
    }

    /**
     * Réglages de l'entreprise dont les écrans ont besoin : le seuil de réforme (R6) est
     * affiché en regard du coût estimé pour éclairer la décision, et les délais de SLA
     * expliquent d'où sortent les échéances affichées.
     *
     * @return array<string, mixed>
     */
    private function parametresPourEcran(): array
    {
        $parametres = ParametreMaintenance::actuel();

        return [
            'seuil_reforme' => (float) $parametres->seuil_reforme,
            'sla_heures' => [
                'critique' => $parametres->sla_critique_heures,
                'haute' => $parametres->sla_haute_heures,
                'normale' => $parametres->sla_normale_heures,
                'basse' => $parametres->sla_basse_heures,
            ],
        ];
    }

    /**
     * Le SLA (R2) s'arrête à la PREMIÈRE réaction de la maintenance, quelle qu'elle soit.
     * Jamais réécrit ensuite : le verdict de dépassement doit rester stable.
     */
    private function horodaterPriseEnCharge(Intervention $intervention): void
    {
        $intervention->date_prise_en_charge ??= now();
    }

    private function refuserSiTerminee(Intervention $intervention): void
    {
        if (in_array($intervention->etape, Intervention::ETAPES_TERMINALES, true)) {
            throw ValidationException::withMessages([
                'etape' => 'Cette intervention est clôturée : elle ne peut plus être modifiée.',
            ]);
        }
    }

    /**
     * Cohérence inventaire (R3/R8) : le réceptionniste passe l'équipement en panne au
     * signalement, la maintenance le rend au parc à la clôture — ou l'en sort
     * définitivement à la réforme (R6).
     */
    private function repercuterSurEquipement(Intervention $intervention): void
    {
        if (! $intervention->equipement) {
            return;
        }

        // R6 : la reforme sort le materiel du parc, definitivement. Elle ne regarde pas
        // les autres pannes ouvertes — l'equipement n'existe plus en service, elles
        // deviennent sans objet.
        if ($intervention->etape === 'reformee') {
            $intervention->equipement->update([
                'statut' => 'reforme',
                'date_reforme' => now()->toDateString(),
            ]);

            return;
        }

        if ($intervention->etape !== 'cloturee') {
            return;
        }

        // Un équipement peut porter plusieurs pannes : il ne redevient sain que
        // lorsqu'aucune autre intervention ouverte ne le concerne.
        $autresPannes = Intervention::where('equipement_id', $intervention->equipement_id)
            ->whereKeyNot($intervention->id)
            ->ouvertes()
            ->exists();

        if (! $autresPannes) {
            $intervention->equipement->update([
                'statut' => $intervention->equipement->appartement_id ? 'affecte' : 'stock',
            ]);
        }
    }
}
