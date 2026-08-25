<?php

namespace Database\Seeders;

use App\Models\Appartement;
use App\Models\Candidat;
use App\Models\Client;
use App\Models\Conge;
use App\Models\ContratTravail;
use App\Models\DemandeService;
use App\Models\Dommage;
use App\Models\Employe;
use App\Models\Entreprise;
use App\Models\Entretien;
use App\Models\Equipement;
use App\Models\Facture;
use App\Models\Intervention;
use App\Models\Licenciement;
use App\Models\OnboardingTache;
use App\Models\ParametreFacturation;
use App\Models\Paiement;
use App\Models\Partenaire;
use App\Models\Recrutement;
use App\Models\Reduction;
use App\Models\Reservation;
use App\Models\Sejour;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Jeu de données pour les démos : à relancer avant chaque présentation via
 * `php artisan db:seed --class=DemoSeeder` (idempotent — updateOrCreate/firstOrCreate
 * partout, aucun risque de doublons si on le relance plusieurs fois). Ne fait pas
 * partie du seeding par défaut (DatabaseSeeder) : c'est un jeu de scénario, pas des
 * données d'installation.
 *
 * Couvre volontairement les 3 statuts de réservation démontrables en direct
 * (en_attente / validee sans séjour / séjour en_cours) + un appartement en
 * maintenance pour illustrer le blocage de réservation.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // 0) Comptes staff (au cas où ce seeder tourne seul sur une base fraîche)
        foreach (['administrateur', 'proprietaire', 'gerant', 'commercial', 'rh', 'compta', 'logistique', 'maintenance', 'receptionniste'] as $role) {
            User::firstOrCreate(
                ['email' => "{$role}@laralab.test"],
                ['name' => ucfirst($role), 'password' => Hash::make('12345678'), 'role' => $role, 'email_verified_at' => now()],
            );
        }

        // 1) Compte client vedette pour la démo : vérifié, avec fiche Client complète
        $userClient = User::firstOrCreate(
            ['email' => 'client@laralab.test'],
            ['name' => 'Client', 'password' => Hash::make('12345678'), 'role' => 'client'],
        );
        $userClient->forceFill(['email_verified_at' => now()])->save();

        $clientVedette = Client::updateOrCreate(
            ['user_id' => $userClient->id],
            ['nom' => 'Koffi', 'prenom' => 'Aya', 'telephone' => '0759000000', 'email' => 'client@laralab.test'],
        );

        // 2) Appartements (variété de types/statuts pour le catalogue public + planning)
        $apparts = [
            'A-101' => ['titre' => 'Suite Akwaba', 'type' => 't2', 'capacite' => 3, 'chambres' => 1, 'salles_de_bain' => 1, 'surface_m2' => 45, 'prix_nuit' => 10000, 'adresse' => 'Abidjan', 'statut_entretien' => 'propre'],
            'A-102' => ['titre' => 'Studio Cocody', 'type' => 'studio', 'capacite' => 2, 'chambres' => 1, 'salles_de_bain' => 1, 'surface_m2' => 28, 'prix_nuit' => 6000, 'adresse' => 'Cocody, Abidjan', 'statut_entretien' => 'propre'],
            'A-103' => ['titre' => 'Villa Riviera', 'type' => 'villa', 'capacite' => 8, 'chambres' => 4, 'salles_de_bain' => 3, 'surface_m2' => 180, 'prix_nuit' => 25000, 'adresse' => 'Riviera Golf, Abidjan', 'statut_entretien' => 'propre'],
            'A-104' => ['titre' => 'Penthouse Plateau', 'type' => 'penthouse', 'capacite' => 4, 'chambres' => 2, 'salles_de_bain' => 2, 'surface_m2' => 95, 'prix_nuit' => 35000, 'adresse' => 'Plateau, Abidjan', 'statut_entretien' => 'en_maintenance'],
            'A-105' => ['titre' => 'Appartement Marcory', 'type' => 't3', 'capacite' => 5, 'chambres' => 2, 'salles_de_bain' => 1, 'surface_m2' => 65, 'prix_nuit' => 15000, 'adresse' => 'Marcory, Abidjan', 'statut_entretien' => 'propre'],
        ];

        $a = [];
        foreach ($apparts as $numero => $data) {
            $a[$numero] = Appartement::updateOrCreate(['numero' => $numero], $data);
        }

        // 3) Équipements affectés (clonés du catalogue) sur quelques appartements
        $catalogue = Equipement::whereNull('appartement_id')->get()->keyBy('nom');
        $affecter = function (Appartement $appartement, array $noms) use ($catalogue) {
            foreach ($noms as $nom) {
                $modele = $catalogue[$nom] ?? null;
                if (! $modele) {
                    continue;
                }
                Equipement::firstOrCreate(
                    ['appartement_id' => $appartement->id, 'nom' => $nom],
                    ['type' => $modele->type, 'icone' => $modele->icone, 'statut' => 'affecte'],
                );
            }
        };
        $affecter($a['A-101'], ['Wifi haut débit', 'Climatisation', 'Smart TV 4K']);
        $affecter($a['A-102'], ['Wifi haut débit', 'Climatisation']);
        $affecter($a['A-103'], ['Wifi haut débit', 'Climatisation', 'Piscine privée', 'Parking privé', 'Conciergerie']);
        $affecter($a['A-105'], ['Wifi haut débit', 'Cuisine équipée', 'Parking privé']);

        // 4) Réductions par durée de séjour sur la Villa (tunnel de prix dégressif)
        Reduction::updateOrCreate(['appartement_id' => $a['A-103']->id, 'nuits_min' => 3], ['type' => 'pourcentage', 'valeur' => 10]);
        Reduction::updateOrCreate(['appartement_id' => $a['A-103']->id, 'nuits_min' => 7], ['type' => 'pourcentage', 'valeur' => 20]);

        // 5) Réservations couvrant les 3 états à démontrer
        $resEnAttente = Reservation::updateOrCreate(
            ['appartement_id' => $a['A-102']->id, 'client_id' => $clientVedette->id, 'date_debut' => now()->addDays(5)->toDateString(), 'date_fin' => now()->addDays(8)->toDateString()],
            ['statut' => 'en_attente', 'nombre_personnes' => 2, 'notes' => 'Arrivée tardive prévue (après 20h)'],
        );

        $resValidee = Reservation::updateOrCreate(
            ['appartement_id' => $a['A-105']->id, 'client_id' => $clientVedette->id, 'date_debut' => now()->addDays(1)->toDateString(), 'date_fin' => now()->addDays(4)->toDateString()],
            ['statut' => 'validee', 'nombre_personnes' => 3],
        );

        $resEnCours = Reservation::updateOrCreate(
            ['appartement_id' => $a['A-103']->id, 'client_id' => $clientVedette->id, 'date_debut' => now()->subDays(2)->toDateString(), 'date_fin' => now()->addDays(1)->toDateString()],
            ['statut' => 'validee', 'nombre_personnes' => 6],
        );
        $sejourEnCours = Sejour::updateOrCreate(
            ['reservation_id' => $resEnCours->id],
            [
                'date_entree' => now()->subDays(2)->toDateString(),
                'etat_lieux_entree' => "État général : Bon\nÉquipements fonctionnels : Wifi haut débit, Climatisation, Piscine privée, Parking privé, Conciergerie\nRemarques : RAS",
                'statut' => 'en_cours',
            ],
        );

        // 6) Partenaires + demandes de service (une liée au séjour en cours, une hors séjour)
        $pressing = Partenaire::updateOrCreate(['nom' => 'Pressing Le Soleil'], ['contact' => '0708112233', 'type_service' => 'Blanchisserie']);
        $traiteur = Partenaire::updateOrCreate(['nom' => 'Abidjan Gourmet'], ['contact' => '0759445566', 'type_service' => 'Restauration']);

        DemandeService::updateOrCreate(
            ['sejour_id' => $sejourEnCours->id, 'designation' => 'Plateau petit-déjeuner x6'],
            ['appartement_id' => $a['A-103']->id, 'partenaire_id' => $traiteur->id, 'quantite' => 6, 'prix_unitaire' => 3500, 'statut' => 'demandee'],
        );
        DemandeService::updateOrCreate(
            ['appartement_id' => $a['A-101']->id, 'designation' => 'Réapprovisionnement linge de maison', 'sejour_id' => null],
            ['partenaire_id' => $pressing->id, 'quantite' => 1, 'prix_unitaire' => 8000, 'statut' => 'livree'],
        );

        // 7) Interventions (pannes) sur des équipements affectés, statuts variés
        $equipA101 = Equipement::where('appartement_id', $a['A-101']->id)->where('nom', 'Smart TV 4K')->first();
        $equipA103 = Equipement::where('appartement_id', $a['A-103']->id)->where('nom', 'Piscine privée')->first();

        if ($equipA101) {
            Intervention::updateOrCreate(
                ['equipement_id' => $equipA101->id, 'description_panne' => 'Télécommande ne répond plus'],
                ['appartement_id' => $a['A-101']->id, 'date_signalement' => now()->subDay(), 'etape' => 'signalee', 'priorite' => 'normale'],
            );
            $equipA101->update(['statut' => 'en_panne']);
        }
        if ($equipA103) {
            Intervention::updateOrCreate(
                ['equipement_id' => $equipA103->id, 'description_panne' => 'Filtration bruyante la nuit'],
                ['appartement_id' => $a['A-103']->id, 'date_signalement' => now()->subDays(3), 'date_resolution' => now()->subDay(), 'etape' => 'cloturee', 'priorite' => 'basse'],
            );
        }

        // 8) Comptabilité : séjours clôturés couvrant les états de facture démontrables
        $this->seedComptabilite($a, $clientVedette);

        // 9) Ressources Humaines : recrutements (5 statuts), pipeline candidat (5 étapes),
        // employés/contrats/congés/licenciement
        $this->seedRh();

        // 10) Phase 09 (multi-tenant) : 2 entreprises pleinement isolées + 1 dormante,
        // pour QA de la scope automatique (BelongsToEntreprise/ScopedThroughEntreprise)
        $this->seedMultiTenant($clientVedette);

        $this->command?->info('Démo prête — client@laralab.test / 12345678 (vérifié), réservations '.
            "en_attente=#{$resEnAttente->id} validee=#{$resValidee->id} en_cours=#{$resEnCours->id}");
    }

    /**
     * Séjours clôturés (dates passées, distincts des réservations en cours ci-dessus)
     * couvrant les 5 états démontrables côté Comptabilité : pas encore de devis, devis
     * brouillon, facture validée avec solde restant, facture intégralement payée,
     * facture rejetée (régénérable).
     */
    private function seedComptabilite(array $a, Client $client): void
    {
        $resSansFacture = Reservation::updateOrCreate(
            ['appartement_id' => $a['A-101']->id, 'client_id' => $client->id, 'date_debut' => now()->subDays(15)->toDateString(), 'date_fin' => now()->subDays(12)->toDateString()],
            ['statut' => 'validee', 'nombre_personnes' => 2],
        );
        Sejour::updateOrCreate(
            ['reservation_id' => $resSansFacture->id],
            [
                'date_entree' => now()->subDays(15)->toDateString(),
                'date_sortie' => now()->subDays(12)->toDateString(),
                'etat_lieux_entree' => "État général : Bon\nRAS",
                'etat_lieux_sortie' => "État général : Bon\nRAS",
                'statut' => 'cloture',
            ],
        );

        $resBrouillon = Reservation::updateOrCreate(
            ['appartement_id' => $a['A-102']->id, 'client_id' => $client->id, 'date_debut' => now()->subDays(20)->toDateString(), 'date_fin' => now()->subDays(17)->toDateString()],
            ['statut' => 'validee', 'nombre_personnes' => 2],
        );
        $sejourBrouillon = Sejour::updateOrCreate(
            ['reservation_id' => $resBrouillon->id],
            [
                'date_entree' => now()->subDays(20)->toDateString(),
                'date_sortie' => now()->subDays(17)->toDateString(),
                'etat_lieux_entree' => "État général : Bon\nRAS",
                'etat_lieux_sortie' => "État général : Bon\nUne tache sur le canapé",
                'statut' => 'cloture',
            ],
        );
        $this->genererFactureDemo($sejourBrouillon, 'brouillon');

        $resPartiel = Reservation::updateOrCreate(
            ['appartement_id' => $a['A-104']->id, 'client_id' => $client->id, 'date_debut' => now()->subDays(25)->toDateString(), 'date_fin' => now()->subDays(21)->toDateString()],
            ['statut' => 'validee', 'nombre_personnes' => 3],
        );
        $sejourPartiel = Sejour::updateOrCreate(
            ['reservation_id' => $resPartiel->id],
            [
                'date_entree' => now()->subDays(25)->toDateString(),
                'date_sortie' => now()->subDays(21)->toDateString(),
                'etat_lieux_entree' => "État général : Bon\nRAS",
                'etat_lieux_sortie' => "État général : Bon\nRobinet de la salle de bain fuit",
                'statut' => 'cloture',
            ],
        );
        Dommage::updateOrCreate(
            ['sejour_id' => $sejourPartiel->id, 'description' => 'Robinet salle de bain à réparer'],
            ['montant' => 15000],
        );
        $facturePartiel = $this->genererFactureDemo($sejourPartiel, 'validee');
        Paiement::updateOrCreate(
            ['facture_id' => $facturePartiel->id, 'reference_transaction' => 'DEMO-ACPT-'.$facturePartiel->id],
            ['montant' => round((float) $facturePartiel->montant_ttc * 0.5), 'mode_paiement' => 'mobile_money', 'date_paiement' => now()->subDays(20)],
        );

        $resPayee = Reservation::updateOrCreate(
            ['appartement_id' => $a['A-105']->id, 'client_id' => $client->id, 'date_debut' => now()->subDays(34)->toDateString(), 'date_fin' => now()->subDays(30)->toDateString()],
            ['statut' => 'validee', 'nombre_personnes' => 4],
        );
        $sejourPayee = Sejour::updateOrCreate(
            ['reservation_id' => $resPayee->id],
            [
                'date_entree' => now()->subDays(34)->toDateString(),
                'date_sortie' => now()->subDays(30)->toDateString(),
                'etat_lieux_entree' => "État général : Bon\nRAS",
                'etat_lieux_sortie' => "État général : Bon\nRAS",
                'statut' => 'cloture',
            ],
        );
        $facturePayee = $this->genererFactureDemo($sejourPayee, 'validee');
        Paiement::updateOrCreate(
            ['facture_id' => $facturePayee->id, 'reference_transaction' => 'DEMO-SOLDE-'.$facturePayee->id],
            ['montant' => $facturePayee->montant_ttc, 'mode_paiement' => 'especes', 'date_paiement' => now()->subDays(30)],
        );
        $facturePayee->update(['statut' => 'payee']);

        $resRejetee = Reservation::updateOrCreate(
            ['appartement_id' => $a['A-103']->id, 'client_id' => $client->id, 'date_debut' => now()->subDays(45)->toDateString(), 'date_fin' => now()->subDays(40)->toDateString()],
            ['statut' => 'validee', 'nombre_personnes' => 5],
        );
        $sejourRejetee = Sejour::updateOrCreate(
            ['reservation_id' => $resRejetee->id],
            [
                'date_entree' => now()->subDays(45)->toDateString(),
                'date_sortie' => now()->subDays(40)->toDateString(),
                'etat_lieux_entree' => "État général : Bon\nRAS",
                'etat_lieux_sortie' => "État général : Bon\nRAS",
                'statut' => 'cloture',
            ],
        );
        $factureRejetee = $this->genererFactureDemo($sejourRejetee, 'brouillon');
        $factureRejetee->update(['statut' => 'annulee', 'motif_rejet' => 'Montant du dépôt de garantie à corriger avant réémission.']);
    }

    /**
     * Reproduit la logique de FactureController::generer() (lignes figées + totaux)
     * sans passer par le contrôleur — appelé directement en seeder, hors contexte HTTP.
     */
    private function genererFactureDemo(Sejour $sejour, string $statutCible, ?int $entrepriseId = null): Facture
    {
        $sejour->loadMissing(['reservation.appartement.reductions', 'demandes', 'dommages']);
        $appartement = $sejour->reservation->appartement;
        $parametres = ParametreFacturation::actuel($entrepriseId);

        $facture = Facture::updateOrCreate(
            ['sejour_id' => $sejour->id],
            ['montant_ht' => 0, 'montant_ttc' => 0, 'statut' => 'brouillon', 'date_edition' => now()->toDateString()],
        );
        $facture->lignes()->delete();

        $nights = max((int) $sejour->date_entree->diffInDays($sejour->date_sortie ?? $sejour->date_entree), 1);
        ['base' => $base, 'reduction' => $reduction, 'discount' => $discount] = $appartement->prixPour($nights);

        $facture->lignes()->create([
            'type' => 'hebergement',
            'designation' => "Hébergement {$appartement->numero} ({$nights} nuit(s))",
            'quantite' => $nights,
            'prix_unitaire' => $appartement->prix_nuit,
            'montant' => $base,
        ]);

        if ($reduction) {
            $facture->lignes()->create([
                'type' => 'reduction',
                'designation' => "Réduction séjour ({$reduction->nuits_min} nuits et +)",
                'quantite' => 1,
                'prix_unitaire' => -$discount,
                'montant' => -$discount,
            ]);
        }

        foreach ($sejour->demandes as $demande) {
            $facture->lignes()->create([
                'type' => 'service',
                'designation' => $demande->designation,
                'quantite' => $demande->quantite,
                'prix_unitaire' => $demande->prix_unitaire,
                'montant' => $demande->quantite * (float) $demande->prix_unitaire,
            ]);
        }

        foreach ($sejour->dommages as $dommage) {
            $facture->lignes()->create([
                'type' => 'dommage',
                'designation' => $dommage->description,
                'quantite' => 1,
                'prix_unitaire' => $dommage->montant ?? 0,
                'montant' => $dommage->montant ?? 0,
            ]);
        }

        $sousTotal = (float) $facture->lignes()->sum('montant');

        if ($parametres->frais_service_actif) {
            $frais = round($sousTotal * (float) $parametres->taux_frais_service);
            $facture->lignes()->create([
                'type' => 'frais_service',
                'designation' => 'Frais de service ('.round((float) $parametres->taux_frais_service * 100).'%)',
                'quantite' => 1,
                'prix_unitaire' => $frais,
                'montant' => $frais,
            ]);
        }

        $montantHt = (float) $facture->lignes()->sum('montant');
        $tva = $parametres->tva_active ? round($montantHt * (float) $parametres->taux_tva) : 0;

        $facture->update([
            'montant_ht' => $montantHt,
            'montant_ttc' => $montantHt + $tva,
            'date_edition' => $sejour->date_sortie->toDateString(),
        ]);

        if ($statutCible === 'validee') {
            $facture->update([
                'numero_facture' => 'FAC-'.$sejour->date_sortie->year.'-'.str_pad((string) $facture->id, 4, '0', STR_PAD_LEFT),
                'date_echeance' => $sejour->date_sortie->copy()->addDays(7)->toDateString(),
                'statut' => 'validee',
            ]);
        }

        return $facture;
    }

    private const TACHES_ONBOARDING_DEMO = [
        'Compte utilisateur créé (accès système)',
        'Poste de travail / équipement remis',
        "Présentation à l'équipe",
        'Documents administratifs signés',
        'Formation initiale effectuée',
    ];

    /**
     * Employés + contrats + congés + licenciement, et recrutements couvrant les 5
     * statuts (brouillon/en_attente_validation/validee/rejetee/clos) avec, sur le
     * recrutement validé, un candidat sur chacune des 5 étapes du Kanban simplifié
     * (recu/entretien/decision/offre/embauche) plus les deux sorties possibles
     * (rejeté après entretien, offre refusée).
     */
    private function seedRh(): void
    {
        $prisca = Employe::updateOrCreate(
            ['nom' => 'Yao', 'prenom' => 'Prisca'],
            ['poste' => 'Réceptionniste', 'date_embauche' => now()->subMonths(8)->toDateString(), 'salaire_base' => null, 'actif' => true],
        );
        ContratTravail::updateOrCreate(
            ['employe_id' => $prisca->id],
            ['type_contrat' => 'cdi', 'salaire' => 150000, 'date_debut' => now()->subMonths(8)->toDateString(), 'date_fin' => null],
        );
        foreach (self::TACHES_ONBOARDING_DEMO as $i => $libelle) {
            OnboardingTache::updateOrCreate(
                ['employe_id' => $prisca->id, 'libelle' => $libelle],
                ['fait' => true, 'date_realisation' => now()->subMonths(7)->toDateString(), 'ordre' => $i + 1],
            );
        }

        $jean = Employe::updateOrCreate(
            ['nom' => 'Kouassi', 'prenom' => 'Jean'],
            ['poste' => "Agent d'entretien", 'date_embauche' => now()->subMonths(3)->toDateString(), 'salaire_base' => null, 'actif' => true],
        );
        ContratTravail::updateOrCreate(
            ['employe_id' => $jean->id],
            ['type_contrat' => 'cdd', 'salaire' => 90000, 'date_debut' => now()->subMonths(3)->toDateString(), 'date_fin' => now()->addMonths(3)->toDateString()],
        );
        foreach (self::TACHES_ONBOARDING_DEMO as $i => $libelle) {
            OnboardingTache::updateOrCreate(
                ['employe_id' => $jean->id, 'libelle' => $libelle],
                ['fait' => $i < 3, 'date_realisation' => $i < 3 ? now()->subMonths(2)->toDateString() : null, 'ordre' => $i + 1],
            );
        }

        $fatim = Employe::updateOrCreate(
            ['nom' => 'Traore', 'prenom' => 'Fatim'],
            ['poste' => 'Réceptionniste', 'date_embauche' => now()->subYear()->toDateString(), 'salaire_base' => null, 'actif' => false],
        );
        ContratTravail::updateOrCreate(
            ['employe_id' => $fatim->id],
            ['type_contrat' => 'cdi', 'salaire' => 145000, 'date_debut' => now()->subYear()->toDateString(), 'date_fin' => now()->subDays(10)->toDateString()],
        );
        Licenciement::updateOrCreate(
            ['employe_id' => $fatim->id],
            ['motif' => 'Absences répétées non justifiées malgré plusieurs rappels.', 'date_notification' => now()->subDays(24)->toDateString(), 'duree_preavis_jours' => 14],
        );

        Conge::updateOrCreate(
            ['employe_id' => $prisca->id, 'date_debut' => now()->addDays(10)->toDateString(), 'date_fin' => now()->addDays(15)->toDateString()],
            ['statut' => 'demande'],
        );
        Conge::updateOrCreate(
            ['employe_id' => $jean->id, 'date_debut' => now()->subDays(20)->toDateString(), 'date_fin' => now()->subDays(15)->toDateString()],
            ['statut' => 'valide'],
        );
        Conge::updateOrCreate(
            ['employe_id' => $prisca->id, 'date_debut' => now()->subDays(60)->toDateString(), 'date_fin' => now()->subDays(55)->toDateString()],
            ['statut' => 'refuse'],
        );

        $recrutRecept = Recrutement::updateOrCreate(
            ['poste' => 'Réceptionniste polyvalent', 'departement' => 'Hébergement'],
            [
                'nombre_postes' => 1, 'type_contrat_propose' => 'cdi', 'priorite' => 'haute',
                'motif' => 'creation_poste', 'lieu' => 'Abidjan', 'statut' => 'validee',
                'date_validation' => now()->subDays(18)->toDateString(),
                'competences' => ['Accueil', 'Anglais', 'Gestion des réservations'],
                'description' => 'Accueil des clients, gestion des check-in/check-out, support Comptabilité.',
            ],
        );

        Recrutement::updateOrCreate(
            ['poste' => 'Agent de ménage', 'departement' => 'Housekeeping'],
            ['nombre_postes' => 2, 'type_contrat_propose' => 'cdd', 'priorite' => 'normale', 'motif' => 'renforcement_equipe', 'lieu' => 'Abidjan', 'statut' => 'en_attente_validation'],
        );

        Recrutement::updateOrCreate(
            ['poste' => 'Chargé de maintenance', 'departement' => 'Technique'],
            ['nombre_postes' => 1, 'type_contrat_propose' => 'cdi', 'priorite' => 'normale', 'motif' => 'creation_poste', 'statut' => 'brouillon'],
        );

        Recrutement::updateOrCreate(
            ['poste' => 'Comptable junior', 'departement' => 'Comptabilité'],
            ['nombre_postes' => 1, 'type_contrat_propose' => 'cdi', 'priorite' => 'basse', 'motif' => 'creation_poste', 'statut' => 'rejetee', 'motif_rejet' => 'Budget non validé pour ce trimestre.'],
        );

        $recrutClos = Recrutement::updateOrCreate(
            ['poste' => 'Community manager', 'departement' => 'Marketing'],
            ['nombre_postes' => 1, 'type_contrat_propose' => 'cdd', 'priorite' => 'basse', 'motif' => 'renforcement_equipe', 'statut' => 'clos', 'date_validation' => now()->subDays(90)->toDateString()],
        );
        Candidat::updateOrCreate(
            ['recrutement_id' => $recrutClos->id, 'nom' => 'Bamba', 'prenom' => 'Issouf'],
            ['email' => 'issouf.bamba@example.test', 'source' => 'linkedin', 'etape' => 'entretien', 'statut' => 'rejete'],
        );

        $cReçu = Candidat::updateOrCreate(
            ['recrutement_id' => $recrutRecept->id, 'nom' => "N'Guessan", 'prenom' => 'Aya'],
            ['email' => 'aya.nguessan@example.test', 'telephone' => '0701020304', 'source' => 'site_web', 'etape' => 'recu', 'statut' => 'en_cours'],
        );

        $cEntretien = Candidat::updateOrCreate(
            ['recrutement_id' => $recrutRecept->id, 'nom' => 'Kone', 'prenom' => 'Salif'],
            ['email' => 'salif.kone@example.test', 'telephone' => '0701020305', 'source' => 'indeed', 'etape' => 'entretien', 'statut' => 'en_cours'],
        );
        Entretien::updateOrCreate(
            ['candidat_id' => $cEntretien->id, 'numero_tour' => 1],
            ['date_entretien' => now()->addDays(2), 'type' => 'visio', 'duree_minutes' => 45, 'statut' => 'planifie'],
        );

        $cRejeteApresEntretien = Candidat::updateOrCreate(
            ['recrutement_id' => $recrutRecept->id, 'nom' => 'Diaby', 'prenom' => 'Moussa'],
            ['email' => 'moussa.diaby@example.test', 'source' => 'autre', 'etape' => 'entretien', 'statut' => 'rejete'],
        );
        Entretien::updateOrCreate(
            ['candidat_id' => $cRejeteApresEntretien->id, 'numero_tour' => 1],
            ['date_entretien' => now()->subDays(5), 'type' => 'presentiel', 'duree_minutes' => 30, 'statut' => 'realise', 'decision' => 'defavorable', 'note' => "Manque d'expérience en gestion de conflit client."],
        );

        $cDecision = Candidat::updateOrCreate(
            ['recrutement_id' => $recrutRecept->id, 'nom' => 'Toure', 'prenom' => 'Awa'],
            ['email' => 'awa.toure@example.test', 'source' => 'linkedin', 'etape' => 'decision', 'statut' => 'en_cours'],
        );
        Entretien::updateOrCreate(
            ['candidat_id' => $cDecision->id, 'numero_tour' => 1],
            ['date_entretien' => now()->subDays(3), 'type' => 'presentiel', 'duree_minutes' => 40, 'statut' => 'realise', 'decision' => 'favorable', 'note' => 'Très bon relationnel, disponible immédiatement.'],
        );

        $cOffre = Candidat::updateOrCreate(
            ['recrutement_id' => $recrutRecept->id, 'nom' => 'Ouattara', 'prenom' => 'Ibrahim'],
            ['email' => 'ibrahim.ouattara@example.test', 'source' => 'site_web', 'etape' => 'offre', 'statut' => 'en_cours', 'salaire_propose' => 155000],
        );
        Entretien::updateOrCreate(
            ['candidat_id' => $cOffre->id, 'numero_tour' => 1],
            ['date_entretien' => now()->subDays(7), 'type' => 'visio', 'duree_minutes' => 40, 'statut' => 'realise', 'decision' => 'favorable'],
        );

        $cOffreRefusee = Candidat::updateOrCreate(
            ['recrutement_id' => $recrutRecept->id, 'nom' => 'Coulibaly', 'prenom' => 'Nadia'],
            ['email' => 'nadia.coulibaly@example.test', 'source' => 'indeed', 'etape' => 'offre', 'statut' => 'offre_refusee', 'salaire_propose' => 150000],
        );
        Entretien::updateOrCreate(
            ['candidat_id' => $cOffreRefusee->id, 'numero_tour' => 1],
            ['date_entretien' => now()->subDays(10), 'type' => 'visio', 'duree_minutes' => 35, 'statut' => 'realise', 'decision' => 'favorable'],
        );

        $cAEmbaucher = Candidat::updateOrCreate(
            ['recrutement_id' => $recrutRecept->id, 'nom' => 'Bakayoko', 'prenom' => 'Fatoumata'],
            ['email' => 'fatoumata.bakayoko@example.test', 'source' => 'linkedin', 'etape' => 'embauche', 'statut' => 'en_cours', 'salaire_propose' => 148000],
        );
        Entretien::updateOrCreate(
            ['candidat_id' => $cAEmbaucher->id, 'numero_tour' => 1],
            ['date_entretien' => now()->subDays(14), 'type' => 'presentiel', 'duree_minutes' => 45, 'statut' => 'realise', 'decision' => 'favorable', 'note' => 'Offre envoyée et acceptée le jour même.'],
        );

        $this->command?->info('Données RH prêtes — recrutement "Réceptionniste polyvalent" #'.$recrutRecept->id.
            " couvre les 5 étapes du Kanban ; candidat #{$cAEmbaucher->id} (Bakayoko Fatoumata) prêt pour l'embauche (page Contrats).");
    }

    /**
     * Phase 09 (multi-tenant) : 2 entreprises actives, chacune avec son propre
     * propriétaire/gérant, appartements, employé, recrutement, paramètres de
     * facturation et un séjour facturé/payé ce mois-ci (pour peupler le tableau de
     * bord Propriétaire) — de quoi vérifier que chaque compte ne voit QUE les
     * données de sa propre entreprise (BelongsToEntreprise/ScopedThroughEntreprise),
     * que l'administrateur les voit toutes, et qu'un compte orphelin (les comptes
     * @laralab.test créés à l'étape 0, sans entreprise_id) ne voit que les données
     * elles-mêmes orphelines déjà seedées plus haut (comportement fail-open). Une
     * 3ᵉ entreprise volontairement vide/suspendue teste le cas "créée mais jamais
     * onboardée" côté admin.
     */
    private function seedMultiTenant(Client $client): void
    {
        $catalogue = Equipement::whereNull('appartement_id')->get()->keyBy('nom');
        $affecter = function (Appartement $appartement, string $nom, string $statut = 'affecte') use ($catalogue) {
            $modele = $catalogue[$nom] ?? null;
            if (! $modele) {
                return null;
            }

            return Equipement::firstOrCreate(
                ['appartement_id' => $appartement->id, 'nom' => $nom],
                ['type' => $modele->type, 'icone' => $modele->icone, 'statut' => $statut],
            );
        };

        // ── Entreprise A : Résidences Konan (active) ──────────────────────────
        $konan = Entreprise::updateOrCreate(
            ['nom' => 'Résidences Konan'],
            ['email_contact' => 'contact@residences-konan.test', 'telephone_contact' => '0707001122', 'adresse' => 'Cocody, Abidjan', 'statut' => 'active', 'date_activation' => now()->subMonths(6)],
        );

        User::updateOrCreate(
            ['email' => 'proprietaire.konan@laralab.test'],
            ['name' => 'Konan Yao', 'password' => Hash::make('12345678'), 'role' => 'proprietaire', 'entreprise_id' => $konan->id, 'actif' => true, 'email_verified_at' => now()],
        );
        User::updateOrCreate(
            ['email' => 'gerant.konan@laralab.test'],
            ['name' => 'Adjoua Marie', 'password' => Hash::make('12345678'), 'role' => 'gerant', 'entreprise_id' => $konan->id, 'actif' => true, 'email_verified_at' => now()],
        );

        $kApt1 = Appartement::updateOrCreate(
            ['numero' => 'K-201'],
            ['entreprise_id' => $konan->id, 'titre' => 'Duplex Konan', 'type' => 't3', 'capacite' => 5, 'chambres' => 2, 'salles_de_bain' => 2, 'surface_m2' => 85, 'prix_nuit' => 20000, 'adresse' => 'Cocody, Abidjan', 'statut_entretien' => 'propre'],
        );
        $kApt2 = Appartement::updateOrCreate(
            ['numero' => 'K-202'],
            ['entreprise_id' => $konan->id, 'titre' => 'Studio Konan', 'type' => 'studio', 'capacite' => 2, 'chambres' => 1, 'salles_de_bain' => 1, 'surface_m2' => 25, 'prix_nuit' => 8000, 'adresse' => 'Cocody, Abidjan', 'statut_entretien' => 'en_maintenance'],
        );
        $affecter($kApt1, 'Wifi haut débit');
        if ($climKonan = $affecter($kApt1, 'Climatisation')) {
            $climKonan->update(['statut' => 'en_panne']);
        }

        $userReceptionKonan = User::updateOrCreate(
            ['email' => 'receptionniste.konan@laralab.test'],
            ['name' => 'Aya N\'Dri', 'password' => Hash::make('12345678'), 'role' => 'receptionniste', 'entreprise_id' => $konan->id, 'actif' => true, 'email_verified_at' => now()],
        );
        Employe::updateOrCreate(
            ['user_id' => $userReceptionKonan->id],
            ['entreprise_id' => $konan->id, 'nom' => "N'Dri", 'prenom' => 'Aya', 'poste' => 'Réceptionniste', 'date_embauche' => now()->subMonths(4)->toDateString(), 'salaire_base' => null, 'actif' => true],
        );

        Recrutement::updateOrCreate(
            ['poste' => 'Femme de chambre', 'departement' => 'Housekeeping', 'entreprise_id' => $konan->id],
            ['nombre_postes' => 1, 'type_contrat_propose' => 'cdd', 'priorite' => 'normale', 'motif' => 'renforcement_equipe', 'lieu' => 'Cocody, Abidjan', 'statut' => 'validee', 'date_validation' => now()->subDays(5)->toDateString()],
        );

        ParametreFacturation::actuel($konan->id)->update([
            'frais_service_actif' => true, 'taux_frais_service' => 0.10,
            'tva_active' => true, 'taux_tva' => 0.18,
            'acompte_actif' => true,
        ]);

        $kRes = Reservation::updateOrCreate(
            ['appartement_id' => $kApt1->id, 'client_id' => $client->id, 'date_debut' => now()->subDays(6)->toDateString(), 'date_fin' => now()->subDays(3)->toDateString()],
            ['statut' => 'validee', 'nombre_personnes' => 3],
        );
        $kSejour = Sejour::updateOrCreate(
            ['reservation_id' => $kRes->id],
            ['date_entree' => now()->subDays(6)->toDateString(), 'date_sortie' => now()->subDays(3)->toDateString(), 'etat_lieux_entree' => "État général : Bon\nRAS", 'etat_lieux_sortie' => "État général : Bon\nRAS", 'statut' => 'cloture'],
        );
        $kFacture = $this->genererFactureDemo($kSejour, 'validee', $konan->id);
        Paiement::updateOrCreate(
            ['facture_id' => $kFacture->id, 'reference_transaction' => 'DEMO-KONAN-'.$kFacture->id],
            ['montant' => $kFacture->montant_ttc, 'mode_paiement' => 'mobile_money', 'date_paiement' => now()->subDays(3)],
        );
        $kFacture->update(['statut' => 'payee']);

        // ── Entreprise B : Hôtel Bayo (essai) ─────────────────────────────────
        $bayo = Entreprise::updateOrCreate(
            ['nom' => 'Hôtel Bayo'],
            ['email_contact' => 'contact@hotel-bayo.test', 'telephone_contact' => '0759332211', 'adresse' => 'Marcory, Abidjan', 'statut' => 'essai', 'date_activation' => now()->subDays(20)],
        );

        User::updateOrCreate(
            ['email' => 'proprietaire.bayo@laralab.test'],
            ['name' => 'Bayo Ibrahim', 'password' => Hash::make('12345678'), 'role' => 'proprietaire', 'entreprise_id' => $bayo->id, 'actif' => true, 'email_verified_at' => now()],
        );
        User::updateOrCreate(
            ['email' => 'gerant.bayo@laralab.test'],
            ['name' => 'Diallo Aminata', 'password' => Hash::make('12345678'), 'role' => 'gerant', 'entreprise_id' => $bayo->id, 'actif' => true, 'email_verified_at' => now()],
        );

        $bApt1 = Appartement::updateOrCreate(
            ['numero' => 'B-301'],
            ['entreprise_id' => $bayo->id, 'titre' => 'Chambre Bayo', 'type' => 'studio', 'capacite' => 2, 'chambres' => 1, 'salles_de_bain' => 1, 'surface_m2' => 22, 'prix_nuit' => 7000, 'adresse' => 'Marcory, Abidjan', 'statut_entretien' => 'propre'],
        );
        $affecter($bApt1, 'Climatisation');

        $userAgentBayo = User::updateOrCreate(
            ['email' => 'maintenance.bayo@laralab.test'],
            ['name' => 'Traore Karim', 'password' => Hash::make('12345678'), 'role' => 'maintenance', 'entreprise_id' => $bayo->id, 'actif' => true, 'email_verified_at' => now()],
        );
        Employe::updateOrCreate(
            ['user_id' => $userAgentBayo->id],
            ['entreprise_id' => $bayo->id, 'nom' => 'Traore', 'prenom' => 'Karim', 'poste' => "Agent d'entretien", 'date_embauche' => now()->subMonths(2)->toDateString(), 'salaire_base' => null, 'actif' => true],
        );

        Recrutement::updateOrCreate(
            ['poste' => 'Gérant adjoint', 'departement' => 'Direction', 'entreprise_id' => $bayo->id],
            ['nombre_postes' => 1, 'type_contrat_propose' => 'cdi', 'priorite' => 'haute', 'motif' => 'creation_poste', 'lieu' => 'Marcory, Abidjan', 'statut' => 'en_attente_validation'],
        );

        ParametreFacturation::actuel($bayo->id)->update([
            'frais_service_actif' => true, 'taux_frais_service' => 0.08,
            'tva_active' => false,
            'acompte_actif' => false,
        ]);

        $bRes = Reservation::updateOrCreate(
            ['appartement_id' => $bApt1->id, 'client_id' => $client->id, 'date_debut' => now()->subDays(8)->toDateString(), 'date_fin' => now()->subDays(6)->toDateString()],
            ['statut' => 'validee', 'nombre_personnes' => 1],
        );
        $bSejour = Sejour::updateOrCreate(
            ['reservation_id' => $bRes->id],
            ['date_entree' => now()->subDays(8)->toDateString(), 'date_sortie' => now()->subDays(6)->toDateString(), 'etat_lieux_entree' => "État général : Bon\nRAS", 'etat_lieux_sortie' => "État général : Bon\nRAS", 'statut' => 'cloture'],
        );
        $bFacture = $this->genererFactureDemo($bSejour, 'validee', $bayo->id);
        Paiement::updateOrCreate(
            ['facture_id' => $bFacture->id, 'reference_transaction' => 'DEMO-BAYO-'.$bFacture->id],
            ['montant' => $bFacture->montant_ttc, 'mode_paiement' => 'especes', 'date_paiement' => now()->subDays(6)],
        );
        $bFacture->update(['statut' => 'payee']);

        // ── Entreprise C : Villa Émeraude (suspendue, jamais onboardée) ───────
        Entreprise::updateOrCreate(
            ['nom' => 'Villa Émeraude'],
            ['email_contact' => null, 'telephone_contact' => null, 'adresse' => 'Assinie', 'statut' => 'suspendue', 'date_activation' => null, 'notes' => 'Dossier en pause — aucun compte propriétaire créé pour l\'instant.'],
        );

        $this->command?->info("Multi-tenant prêt — Résidences Konan (#{$konan->id}, active) et Hôtel Bayo (#{$bayo->id}, essai) isolées l'une de l'autre ; Villa Émeraude (suspendue, sans compte) pour tester l'onboarding admin.");
    }
}
