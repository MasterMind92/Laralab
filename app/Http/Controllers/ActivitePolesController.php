<?php

namespace App\Http\Controllers;

use App\Models\Besoin;
use App\Models\Commande;
use App\Models\DemandeService;
use App\Models\Dommage;
use App\Models\Employe;
use App\Models\Entreprise;
use App\Models\Facture;
use App\Models\FactureFournisseur;
use App\Models\Intervention;
use App\Models\Paiement;
use App\Models\Recrutement;
use App\Models\ReceptionLigne;
use App\Models\Reservation;
use App\Models\Sejour;
use App\Models\Tache;
use App\Support\Poles;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Résumé de l'activité de chaque pôle sur un seul écran — voir `specification.md` à la
 * racine du projet pour la définition exacte de chaque indicateur : chacun est repris
 * tel quel d'un tableau de bord de pôle déjà existant, aucune définition n'est réinventée
 * ici.
 *
 * Deux publics, même rapport :
 *   - `moi()` (Propriétaire/Gérant) — scopé automatiquement à leur entreprise par les
 *     global scopes multi-tenant, comme Proprietaire\DashboardController.
 *   - `pourEntreprise()` (administrateur) — exempté des global scopes
 *     (User::TENANT_EXEMPT_ROLES), donc chaque requête filtre explicitement sur
 *     l'entreprise consultée, même précaution que Admin\DashboardController.
 *
 * Les 5 méthodes privées ci-dessous acceptent un `$entrepriseId` optionnel plutôt que
 * de dupliquer intégralement le rapport une seconde fois : null laisse jouer le scope
 * automatique (cas `moi()`), un id ajoute le filtre explicite (cas `pourEntreprise()`).
 */
class ActivitePolesController extends Controller
{
    /**
     * `EnsureUserHasRole::GLOBAL_BYPASS_ROLES` laisse un administrateur franchir
     * `role:proprietaire,gerant` sans être ni l'un ni l'autre — et comme il fait aussi
     * partie de `User::TENANT_EXEMPT_ROLES`, `poles(null)` tournerait pour lui
     * entièrement hors scope : compteurs mélangeant toutes les entreprises (et les
     * données orphelines pré-Phase-09), présentés sans le bandeau "Vous consultez"
     * qui signale normalement une vue non scopée. La sidebar cache déjà ce lien pour ce
     * rôle ; ce garde-fou empêche qu'il reste joignable par URL directe.
     */
    public function moi(): Response
    {
        abort_if(auth()->user()?->role === 'administrateur', 404);

        return Inertia::render('activite-poles', [
            'poles' => $this->poles(null),
        ]);
    }

    public function pourEntreprise(Entreprise $entreprise): Response
    {
        return Inertia::render('activite-poles', [
            'poles' => $this->poles($entreprise->id),
            'entreprise' => ['id' => $entreprise->id, 'nom' => $entreprise->nom],
        ]);
    }

    /**
     * @return array<int, array{slug: string, label: string, kpis: array<int, array{label: string, value: int|float, unite?: string}>}>
     */
    private function poles(?int $entrepriseId): array
    {
        return [
            $this->reception($entrepriseId),
            $this->maintenance($entrepriseId),
            $this->comptabilite($entrepriseId),
            $this->rh($entrepriseId),
            $this->logistique($entrepriseId),
        ];
    }

    private function reception(?int $entrepriseId): array
    {
        return [
            'slug' => 'reception',
            'label' => Poles::libelle('reception'),
            'kpis' => [
                [
                    'label' => 'Réservations en attente',
                    'value' => Reservation::where('statut', 'en_attente')
                        ->when($entrepriseId, fn ($q, $id) => $q->whereHas('appartement', fn ($q2) => $q2->where('entreprise_id', $id)))
                        ->count(),
                ],
                [
                    'label' => 'Séjours en cours',
                    'value' => Sejour::where('statut', 'en_cours')
                        ->when($entrepriseId, fn ($q, $id) => $q->whereHas('reservation.appartement', fn ($q2) => $q2->where('entreprise_id', $id)))
                        ->count(),
                ],
                [
                    'label' => 'Demandes de service en attente',
                    'value' => DemandeService::where('statut', 'demandee')
                        ->when($entrepriseId, fn ($q, $id) => $q->whereHas('appartement', fn ($q2) => $q2->where('entreprise_id', $id)))
                        ->count(),
                ],
                [
                    'label' => 'Dommages non facturés',
                    'value' => Dommage::whereHas('sejour', fn ($q) => $q->whereDoesntHave('facture'))
                        ->when($entrepriseId, fn ($q, $id) => $q->whereHas('sejour.reservation.appartement', fn ($q2) => $q2->where('entreprise_id', $id)))
                        ->count(),
                ],
            ],
        ];
    }

    private function maintenance(?int $entrepriseId): array
    {
        $filtreAppartement = fn ($q, $id) => $q->whereHas('appartement', fn ($q2) => $q2->where('entreprise_id', $id));

        return [
            'slug' => 'maintenance',
            'label' => Poles::libelle('maintenance'),
            'kpis' => [
                [
                    'label' => 'Pannes à prendre en charge',
                    'value' => Intervention::where('etape', 'signalee')->when($entrepriseId, $filtreAppartement)->count(),
                ],
                [
                    'label' => 'SLA dépassés',
                    'value' => Intervention::horsDelai()->when($entrepriseId, $filtreAppartement)->count(),
                ],
                [
                    'label' => 'En réparation',
                    'value' => Intervention::where('etape', 'en_cours')->when($entrepriseId, $filtreAppartement)->count(),
                ],
                [
                    'label' => 'Interventions ouvertes',
                    'value' => Intervention::ouvertes()->when($entrepriseId, $filtreAppartement)->count(),
                ],
            ],
        ];
    }

    private function comptabilite(?int $entrepriseId): array
    {
        $filtreFacture = fn ($q, $id) => $q->whereHas('sejour.reservation.appartement', fn ($q2) => $q2->where('entreprise_id', $id));

        return [
            'slug' => 'comptabilite',
            'label' => Poles::libelle('comptabilite'),
            'kpis' => [
                [
                    'label' => 'Encaissé ce mois-ci',
                    'value' => (float) Paiement::whereMonth('date_paiement', now()->month)
                        ->whereYear('date_paiement', now()->year)
                        ->when($entrepriseId, fn ($q, $id) => $q->where(fn ($q2) => $q2
                            ->whereHas('facture.sejour.reservation.appartement', fn ($q3) => $q3->where('entreprise_id', $id))
                            ->orWhereHas('reservation.appartement', fn ($q3) => $q3->where('entreprise_id', $id))))
                        ->sum('montant'),
                    'unite' => 'FCFA',
                ],
                [
                    'label' => 'Créances clients',
                    'value' => (float) Facture::where('statut', 'validee')
                        ->when($entrepriseId, $filtreFacture)
                        ->get()
                        ->sum(fn (Facture $f) => $f->soldeRestant()),
                    'unite' => 'FCFA',
                ],
                [
                    'label' => 'Dettes fournisseur',
                    'value' => (float) FactureFournisseur::aDue()
                        ->when($entrepriseId, fn ($q, $id) => $q->where('entreprise_id', $id))
                        ->with('lignes')
                        ->get()
                        ->sum(fn (FactureFournisseur $f) => $f->montantTotal()),
                    'unite' => 'FCFA',
                ],
                [
                    'label' => 'Achats à valider',
                    'value' => FactureFournisseur::aValider()->when($entrepriseId, fn ($q, $id) => $q->where('entreprise_id', $id))->count(),
                ],
            ],
        ];
    }

    private function rh(?int $entrepriseId): array
    {
        return [
            'slug' => 'rh',
            'label' => Poles::libelle('rh'),
            'kpis' => [
                [
                    'label' => 'Employés actifs',
                    'value' => Employe::where('actif', true)->when($entrepriseId, fn ($q, $id) => $q->where('entreprise_id', $id))->count(),
                ],
                [
                    'label' => 'Recrutements ouverts',
                    'value' => Recrutement::whereIn('statut', ['en_attente_validation', 'validee'])
                        ->when($entrepriseId, fn ($q, $id) => $q->where('entreprise_id', $id))
                        ->count(),
                ],
                [
                    'label' => 'Tâches à planifier',
                    'value' => Tache::where('statut', 'a_faire')
                        ->whereHas('reservation', fn ($q) => $q->where('statut', 'validee'))
                        ->when($entrepriseId, fn ($q, $id) => $q->whereHas('appartement', fn ($q2) => $q2->where('entreprise_id', $id)))
                        ->count(),
                ],
            ],
        ];
    }

    private function logistique(?int $entrepriseId): array
    {
        return [
            'slug' => 'logistique',
            'label' => Poles::libelle('logistique'),
            'kpis' => [
                [
                    'label' => 'Besoins à valider',
                    'value' => Besoin::where('statut', 'soumis')->when($entrepriseId, fn ($q, $id) => $q->where('entreprise_id', $id))->count(),
                ],
                [
                    'label' => 'Besoins à commander',
                    'value' => Besoin::aCommander()->when($entrepriseId, fn ($q, $id) => $q->where('entreprise_id', $id))->count(),
                ],
                [
                    'label' => 'Commandes ouvertes',
                    'value' => Commande::ouvertes()->when($entrepriseId, fn ($q, $id) => $q->where('entreprise_id', $id))->count(),
                ],
                [
                    'label' => 'Pièces à enregistrer',
                    'value' => (int) ReceptionLigne::aEnregistrer()
                        ->when($entrepriseId, fn ($q, $id) => $q->whereHas('reception.commande', fn ($q2) => $q2->where('entreprise_id', $id)))
                        ->sum(DB::raw('quantite_recue - quantite_enregistree')),
                ],
            ],
        ];
    }
}
