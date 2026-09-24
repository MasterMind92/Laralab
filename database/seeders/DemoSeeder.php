<?php

namespace Database\Seeders;

use App\Models\Appartement;
use App\Models\Besoin;
use App\Models\Candidat;
use App\Models\Client;
use App\Models\Commande;
use App\Models\CommandeLigne;
use App\Models\Conge;
use App\Models\ContratTravail;
use App\Models\DemandeService;
use App\Models\Depense;
use App\Models\Dommage;
use App\Models\Employe;
use App\Models\Entreprise;
use App\Models\Entretien;
use App\Models\Equipement;
use App\Models\Facture;
use App\Models\FactureFournisseur;
use App\Models\FactureFournisseurLigne;
use App\Models\Fournisseur;
use App\Models\Intervention;
use App\Models\InterventionAction;
use App\Models\Licenciement;
use App\Models\OnboardingTache;
use App\Models\Paiement;
use App\Models\ParametreFacturation;
use App\Models\ParametreMaintenance;
use App\Models\Partenaire;
use App\Models\Reception;
use App\Models\ReceptionLigne;
use App\Models\Recrutement;
use App\Models\Reduction;
use App\Models\Relance;
use App\Models\Reservation;
use App\Models\Sejour;
use App\Models\User;
use App\Support\HeuresOuvrees;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
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
        foreach (['administrateur', 'proprietaire', 'gerant', 'rh', 'compta', 'logistique', 'maintenance', 'receptionniste'] as $role) {
            User::firstOrCreate(
                ['email' => "{$role}@laralab.test"],
                ['name' => ucfirst($role), 'password' => Hash::make('12345678'), 'role' => $role, 'email_verified_at' => now()],
            );
        }

        // 0bis) Catalogue d'équipements (appartement_id null) — même précaution que les
        // comptes staff ci-dessus : ce seeder est censé pouvoir tourner seul sur une base
        // fraîche, mais les $affecter() plus bas (étapes 3, seedMultiTenant()) lisent ce
        // catalogue par nom et ne créent rien silencieusement si une entrée manque. Sans
        // cet appel, une base où seul DemoSeeder a tourné (DatabaseSeeder jamais lancé)
        // laissait tous les appartements sans le moindre équipement affecté.
        $this->call(EquipementCatalogueSeeder::class);

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
        // Parc volontairement fourni : le pole Maintenance a besoin d'assez de materiel
        // distinct pour que les 8 etapes du workflow soient peuplees simultanement
        // (voir seedMaintenance()). Les intitules restent ceux du catalogue client —
        // cette table sert AUSSI la liste d'equipements affichee sur le portail public,
        // on n'y injecte donc pas de materiel technique qui n'a rien a y faire.
        $affecter($a['A-101'], ['Wifi haut débit', 'Climatisation', 'Smart TV 4K', 'Cuisine équipée', 'Machine à laver', 'Accès sécurisé']);
        $affecter($a['A-102'], ['Wifi haut débit', 'Climatisation', 'Smart TV 4K', 'Cuisine équipée']);
        $affecter($a['A-103'], ['Wifi haut débit', 'Climatisation', 'Smart TV 4K', 'Cuisine équipée', 'Machine à laver', 'Piscine privée', 'Parking privé', 'Conciergerie', 'Accès sécurisé']);
        $affecter($a['A-104'], ['Wifi haut débit', 'Climatisation', 'Smart TV 4K', 'Cuisine équipée', 'Machine à laver', 'Accès sécurisé', "Vue sur l'océan"]);
        $affecter($a['A-105'], ['Wifi haut débit', 'Climatisation', 'Smart TV 4K', 'Cuisine équipée', 'Machine à laver', 'Parking privé']);

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

        // 7) Pole Maintenance : le pipeline complet, 5 interventions par etape (voir
        // seedMaintenance()). Appele APRES seedRh(), qui cree le declarant et les
        // techniciens auxquels ces interventions sont rattachees.

        // 8) Comptabilité : séjours clôturés couvrant les états de facture démontrables
        $this->seedComptabilite($a, $clientVedette);

        // 9) Ressources Humaines : recrutements (5 statuts), pipeline candidat (5 étapes),
        // employés/contrats/congés/licenciement
        $this->seedRh();

        $this->seedMaintenance($a);

        // 10) Phase 09 (multi-tenant) : 2 entreprises pleinement isolées + 1 dormante,
        // pour QA de la scope automatique (BelongsToEntreprise/ScopedThroughEntreprise)
        $this->seedMultiTenant($clientVedette);

        // 11) Phase 10 (logistique) : la chaîne d'approvisionnement complète, chez Konan.
        // Appelé APRÈS seedMultiTenant(), qui crée l'entreprise, le logisticien et sa fiche
        // employé — ce sont eux qui portent le demandeur, le valideur et le réceptionnaire.
        $this->seedLogistique();

        // 12) Phase 06 (comptabilité avancée) : la chaîne besoin → commande → achat →
        // dépense, entièrement chez Bayo. Appelé APRÈS seedMultiTenant() (entreprise,
        // magasinière) et APRÈS seedLogistique() (dont elle réutilise les helpers
        // commandeDemo()/receptionDemo()) — Bayo garde sa propre chaîne, indépendante
        // de celle de Konan.
        $this->seedAchatsBayo();

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
        // user_id rattache la fiche employe au compte de connexion : sans ce lien,
        // InterventionController::store() enregistre un declarant_employe_id null et
        // l'ecran Maintenance affiche "Declaree par : —".
        $prisca = Employe::updateOrCreate(
            ['nom' => 'Yao', 'prenom' => 'Prisca'],
            [
                'user_id' => User::where('email', 'receptionniste@laralab.test')->value('id'),
                'poste' => 'Réceptionniste', 'date_embauche' => now()->subMonths(8)->toDateString(),
                'salaire_base' => null, 'actif' => true,
            ],
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

        // --- Techniciens du pole Maintenance (Phase 05) ---------------------------
        // Seuls ces employes sont proposes a l'affectation d'une intervention : le
        // filtre porte sur l'intitule du poste (Employe::MOTSCLES_POSTE_MAINTENANCE),
        // les roles metiers etant des valeurs de `poste` et non des roles systeme.
        // Les trois intitules couvrent volontairement les variantes que le filtre doit
        // accepter : "Technicien", le feminin "Technicienne", et un poste sans le mot
        // technicien mais avec "maintenance". Prisca (Receptionniste) et Jean (Agent
        // d'entretien) restent les contre-exemples : ils ne doivent PAS apparaitre.
        $technicienChef = Employe::updateOrCreate(
            ['nom' => 'Kone', 'prenom' => 'Ibrahim'],
            [
                // Rattache au compte maintenance@laralab.test : c'est lui que
                // changerEtape() auto-affecte quand une reparation demarre sans
                // technicien nomme.
                'user_id' => User::where('email', 'maintenance@laralab.test')->value('id'),
                'poste' => 'Technicien de maintenance', 'date_embauche' => now()->subMonths(14)->toDateString(),
                'salaire_base' => null, 'actif' => true,
            ],
        );
        ContratTravail::updateOrCreate(
            ['employe_id' => $technicienChef->id],
            ['type_contrat' => 'cdi', 'salaire' => 175000, 'date_debut' => now()->subMonths(14)->toDateString(), 'date_fin' => null],
        );

        $technicienneCvc = Employe::updateOrCreate(
            ['nom' => 'Diallo', 'prenom' => 'Mariam'],
            ['poste' => 'Technicienne CVC (climatisation)', 'date_embauche' => now()->subMonths(6)->toDateString(), 'salaire_base' => null, 'actif' => true],
        );
        ContratTravail::updateOrCreate(
            ['employe_id' => $technicienneCvc->id],
            ['type_contrat' => 'cdi', 'salaire' => 150000, 'date_debut' => now()->subMonths(6)->toDateString(), 'date_fin' => null],
        );

        $chargeMaintenance = Employe::updateOrCreate(
            ['nom' => 'Sangare', 'prenom' => 'Moussa'],
            ['poste' => 'Charge de maintenance', 'date_embauche' => now()->subMonths(2)->toDateString(), 'salaire_base' => null, 'actif' => true],
        );
        ContratTravail::updateOrCreate(
            ['employe_id' => $chargeMaintenance->id],
            ['type_contrat' => 'cdd', 'salaire' => 140000, 'date_debut' => now()->subMonths(2)->toDateString(), 'date_fin' => now()->addMonths(10)->toDateString()],
        );

        // Technicien INACTIF : verifie que le sélecteur filtre bien aussi sur `actif`,
        // pas seulement sur l'intitule du poste.
        Employe::updateOrCreate(
            ['nom' => 'Bakayoko', 'prenom' => 'Seydou'],
            ['poste' => 'Technicien electricite', 'date_embauche' => now()->subYears(2)->toDateString(), 'salaire_base' => null, 'actif' => false],
        );

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
     * Pannes plausibles par équipement. Trois libellés chacun : le couple
     * (équipement, description) sert de clé naturelle aux interventions ci-dessous, donc
     * un équipement ne peut pas porter deux fois la même panne — la répartition garantit
     * qu'aucun n'est sollicité plus de deux fois.
     *
     * Seuls les équipements dont la panne a un sens sont listés : ni « Parking privé »,
     * ni « Conciergerie », ni « Vue sur l'océan » ne tombent en panne.
     */
    private const PANNES_DEMO = [
        'Wifi haut débit' => ['Plus aucun signal dans la chambre', 'Débit très faible en soirée', 'La box redémarre en boucle'],
        'Climatisation' => ['Ne refroidit plus du tout', "Fuite d'eau sous l'unité intérieure", 'Bruit métallique au démarrage'],
        'Smart TV 4K' => ['Télécommande ne répond plus', "L'écran reste noir à l'allumage", 'Plus de son sur toutes les chaînes'],
        'Cuisine équipée' => ['Plaque de cuisson hors service', "La hotte ne s'allume plus", 'Le four ne monte plus en température'],
        'Machine à laver' => ['Ne vidange plus en fin de cycle', 'Tambour bloqué', 'Fuite au niveau du hublot'],
        'Piscine privée' => ['Filtration bruyante la nuit', 'Eau trouble malgré le traitement', 'La pompe ne démarre plus'],
        'Accès sécurisé' => ["Badge non reconnu à l'entrée", 'Gâche électrique bloquée', 'Interphone muet'],
    ];

    /**
     * Pièce type posée selon l'équipement, pour que le journal d'actions (R4) reste
     * crédible en démo — et pour préfigurer le pont vers le stock de la Phase 10.
     */
    private const PIECES_DEMO = [
        'Wifi haut débit' => ["Point d'accès Wifi 6", 45000],
        'Climatisation' => ['Condensateur de démarrage 35µF', 28000],
        'Smart TV 4K' => ["Carte d'alimentation TV", 62000],
        'Cuisine équipée' => ['Résistance de four 2000W', 35000],
        'Machine à laver' => ['Pompe de vidange', 32000],
        'Piscine privée' => ['Moteur de pompe de filtration', 145000],
        'Accès sécurisé' => ['Gâche électrique 12V', 24000],
    ];

    /**
     * Le pipeline de démo : 5 interventions sur CHACUNE des 8 étapes.
     *
     * `ages_heures` donne l'ancienneté du signalement de chacune des 5 lignes. C'est ce
     * qui pilote le dépassement de SLA : une intervention non prise en charge depuis
     * plus de quelques heures ouvrées est mécaniquement hors délai — d'où, sur l'étape
     * `signalee`, deux lignes récentes (dans les temps) et trois anciennes (en rouge).
     */
    private const PIPELINE_MAINTENANCE = [
        ['etape' => 'signalee', 'ages_heures' => [2, 5, 30, 54, 76], 'prise_en_charge' => false, 'technicien' => false, 'actions' => 0, 'conformite' => false, 'terminee' => false],
        ['etape' => 'planifiee', 'ages_heures' => [26, 34, 50, 74, 98], 'prise_en_charge' => true, 'technicien' => false, 'actions' => 0, 'conformite' => false, 'terminee' => false],
        ['etape' => 'technicien_affecte', 'ages_heures' => [30, 48, 72, 96, 120], 'prise_en_charge' => true, 'technicien' => true, 'actions' => 0, 'conformite' => false, 'terminee' => false],
        ['etape' => 'en_cours', 'ages_heures' => [50, 74, 98, 122, 146], 'prise_en_charge' => true, 'technicien' => true, 'actions' => 2, 'conformite' => false, 'terminee' => false],
        ['etape' => 'reparee', 'ages_heures' => [98, 122, 146, 170, 194], 'prise_en_charge' => true, 'technicien' => true, 'actions' => 3, 'conformite' => false, 'terminee' => false],
        ['etape' => 'controlee', 'ages_heures' => [146, 170, 194, 218, 242], 'prise_en_charge' => true, 'technicien' => true, 'actions' => 3, 'conformite' => true, 'terminee' => false],
        ['etape' => 'cloturee', 'ages_heures' => [242, 290, 338, 386, 434], 'prise_en_charge' => true, 'technicien' => true, 'actions' => 3, 'conformite' => true, 'terminee' => true],
        ['etape' => 'reformee', 'ages_heures' => [266, 314, 362, 410, 458], 'prise_en_charge' => true, 'technicien' => true, 'actions' => 2, 'conformite' => false, 'terminee' => true],
    ];

    private const PRIORITES_DEMO = ['critique', 'haute', 'normale', 'basse', 'haute'];

    /**
     * Pôle Maintenance (Phase 05) : le pipeline complet, du signalement par la réception
     * jusqu'aux deux issues terminales. 5 interventions par étape sur les 8 étapes du
     * workflow interne — de quoi montrer les trois écrans du pôle réellement remplis, la
     * répartition du tableau de bord, des SLA tenus ET dépassés, un journal d'actions
     * chiffré, des équipements sous garantie, et la réforme comme sortie alternative.
     *
     * Idempotent comme le reste du seeder : la clé naturelle est le couple (équipement,
     * description de la panne), et le jeu de cas est entièrement déterministe — relancer
     * le seeder met à jour les mêmes lignes plutôt que d'en empiler de nouvelles.
     *
     * Appelé APRÈS seedRh(), dont il consomme le déclarant (Prisca, réception) et les
     * techniciens (postes filtrés par Employe::MOTSCLES_POSTE_MAINTENANCE).
     *
     * @param  array<string, Appartement>  $a  les appartements de la demo (A-101...A-105)
     */
    private function seedMaintenance(array $a): void
    {
        $parametres = ParametreMaintenance::actuel(null);

        $declarant = Employe::where('nom', 'Yao')->where('prenom', 'Prisca')->first();
        $techniciens = Employe::where('actif', true)->techniciensMaintenance()->orderBy('id')->get();

        // Parc réparable, ordonné pour que la répartition reste stable d'un run à l'autre.
        //
        // Borné aux appartements de la démo : seedMultiTenant() a son propre décor
        // (Résidences Konan / Hôtel Bayo) dont il pilote lui-même les statuts
        // d'équipement — il remet notamment une climatisation en panne, et il tourne
        // APRÈS cette méthode. Sans ce garde-fou, le pipeline Maintenance réformait du
        // matériel appartenant à ces entreprises, puis se faisait écraser par elles.
        $parc = Equipement::whereIn('appartement_id', collect($a)->pluck('id'))
            ->whereIn('nom', array_keys(self::PANNES_DEMO))
            ->orderBy('appartement_id')
            ->orderBy('nom')
            ->get();

        if ($techniciens->isEmpty() || $parc->count() < 10) {
            $this->command?->warn('seedMaintenance ignoré : il faut au moins un technicien actif et 10 équipements réparables.');

            return;
        }

        // Garantie / n° de série / contrat sur tout le parc, avec un tiers encore sous
        // garantie : alimente le badge « Sous garantie » (R7) et préfigure le futur écran
        // « Parc équipements » de l'étape C.
        foreach ($parc as $index => $equipement) {
            $equipement->update([
                'numero_serie' => 'SN-'.str_pad((string) $equipement->id, 5, '0', STR_PAD_LEFT),
                'garantie_fin' => $index % 3 === 0
                    ? now()->addMonths(8)->toDateString()
                    : now()->subMonths(5)->toDateString(),
                'contrat_maintenance' => $index % 4 === 0,
                'contrat_reference' => $index % 4 === 0 ? 'CTR-'.(2000 + $equipement->id) : null,
                'contrat_echeance' => $index % 4 === 0 ? now()->addYear()->toDateString() : null,
            ]);
        }

        // Les 5 derniers équipements sont réservés à la réforme : ils sortent
        // définitivement du parc, ils ne doivent donc porter aucune autre panne.
        $aReformer = $parc->slice($parc->count() - 5)->values();
        $reparables = $parc->slice(0, $parc->count() - 5)->values();

        $curseur = 0;
        $rotation = 0;
        $occurrences = [];
        $recapitulatif = [];

        foreach (self::PIPELINE_MAINTENANCE as $specification) {
            $reforme = $specification['etape'] === 'reformee';

            foreach ($specification['ages_heures'] as $rang => $ageHeures) {
                $equipement = $reforme ? $aReformer[$rang] : $reparables[$curseur++ % $reparables->count()];

                $occurrence = $occurrences[$equipement->id] ?? 0;
                $occurrences[$equipement->id] = $occurrence + 1;

                $priorite = self::PRIORITES_DEMO[$rang];
                $signalement = now()->subHours($ageHeures);
                $echeance = HeuresOuvrees::ajouter($signalement, $parametres->heuresPour($priorite), $parametres);

                // Une prise en charge sur quatre est volontairement en retard : le
                // tableau de bord doit aussi montrer des SLA ratés sur des dossiers déjà
                // traités, pas seulement sur des pannes laissées de côté.
                $priseEnCharge = null;
                if ($specification['prise_en_charge']) {
                    $priseEnCharge = $rang % 4 === 0
                        ? $echeance->copy()->addHours(5)
                        : $signalement->copy()->addMinutes(25);
                }

                $technicien = $specification['technicien'] ? $techniciens[$rotation++ % $techniciens->count()] : null;
                $resolution = $specification['terminee'] ? $signalement->copy()->addHours(max($ageHeures - 12, 4)) : null;

                $attributs = [
                    'appartement_id' => $equipement->appartement_id,
                    'declarant_employe_id' => $declarant?->id,
                    'technicien_employe_id' => $technicien?->id,
                    'priorite' => $priorite,
                    'date_signalement' => $signalement,
                    'date_planifiee' => $specification['prise_en_charge'] ? $signalement->copy()->addHours(20) : null,
                    'date_prise_en_charge' => $priseEnCharge,
                    'sla_echeance' => $echeance,
                    'date_resolution' => $resolution,
                    'etape' => $specification['etape'],
                ];

                // Toujours ecrites, y compris a null : sans cela une intervention
                // qui change d'etape d'un run a l'autre conserverait le resultat de
                // conformite de son etape precedente, et on verrait un dossier
                // "en cours" deja marque conforme.
                $attributs['conformite_resultat'] = $specification['conformite'] ? 'conforme' : null;
                $attributs['conformite_testee_le'] = $specification['conformite'] ? ($resolution ?? $signalement)->copy()->subHours(2) : null;
                $attributs['conformite_employe_id'] = $specification['conformite'] ? $technicien?->id : null;

                if ($reforme) {
                    // Coût de remise en état au-dessus du seuil : c'est exactement le cas
                    // que la règle R6 doit trancher en faveur de la réforme.
                    $attributs['motif_reforme'] = 'Coût de remise en état supérieur à la valeur résiduelle du matériel.';
                    $attributs['cout_reparation_estime'] = (float) $parametres->seuil_reforme + 25000;
                }

                $intervention = Intervention::updateOrCreate(
                    [
                        'equipement_id' => $equipement->id,
                        'description_panne' => self::PANNES_DEMO[$equipement->nom][$occurrence % 3],
                    ],
                    $attributs,
                );

                // sous_garantie est hors Fillable : figée à la déclaration et jamais
                // recalculée ensuite (R7), d'où le forceFill explicite.
                $intervention->forceFill(['sous_garantie' => $equipement->estSousGarantie()])->save();

                $this->seedJournalIntervention($intervention, $equipement, $specification['actions']);

                $recapitulatif[$specification['etape']] = ($recapitulatif[$specification['etape']] ?? 0) + 1;
            }
        }

        // Cohérence inventaire (R3/R8) recalculée UNE FOIS toutes les interventions
        // posées, jamais intervention par intervention : un même équipement peut porter
        // plusieurs pannes, et il ne redevient sain que lorsqu'aucune n'est encore
        // ouverte — clôturer l'une d'elles ne suffit pas.
        foreach ($aReformer as $equipement) {
            $equipement->update([
                'statut' => 'reforme',
                'date_reforme' => now()->subDays(9)->toDateString(),
            ]);
        }
        foreach ($reparables as $equipement) {
            $equipement->update([
                'statut' => Intervention::where('equipement_id', $equipement->id)->ouvertes()->exists() ? 'en_panne' : 'affecte',
            ]);
        }

        // Rattrapage des interventions antérieures à la Phase 05 étape B (et de celles
        // saisies à la main pendant les tests) : sans échéance, elles afficheraient un
        // SLA « — » au milieu d'un jeu de démo par ailleurs complet.
        foreach (Intervention::whereNull('sla_echeance')->whereIn('appartement_id', collect($a)->pluck('id'))->get() as $orpheline) {
            $orpheline->update([
                'sla_echeance' => HeuresOuvrees::ajouter(
                    $orpheline->date_signalement ?? now(),
                    $parametres->heuresPour($orpheline->priorite ?? 'normale'),
                    $parametres,
                ),
            ]);
        }

        $this->command?->info('Maintenance prête — '.array_sum($recapitulatif).' interventions : '.
            collect($recapitulatif)->map(fn ($total, $etape) => "{$etape}={$total}")->implode(', '));
    }

    /**
     * Journal d'actions (R4) d'une intervention : diagnostic, pose de pièce, réparation.
     * cout_total en est la somme dérivée, jamais saisie à la main — d'où le
     * recalculerCout() final, qui est le seul écrivain légitime de ce champ.
     */
    private function seedJournalIntervention(Intervention $intervention, Equipement $equipement, int $nombre): void
    {
        [$piece, $coutPiece] = self::PIECES_DEMO[$equipement->nom];
        $depart = $intervention->date_prise_en_charge ?? $intervention->date_signalement;

        $lignes = [
            [
                'type' => 'diagnostic',
                'description' => 'Contrôle sur place et identification de la panne.',
                'temps_passe_minutes' => 40,
                'piece_libelle' => null,
                'piece_quantite' => null,
                'cout' => 0,
                'effectuee_le' => $depart->copy()->addHours(2),
            ],
            [
                'type' => 'piece',
                'description' => null,
                'temps_passe_minutes' => null,
                'piece_libelle' => $piece,
                'piece_quantite' => 1,
                'cout' => $coutPiece,
                'effectuee_le' => $depart->copy()->addHours(5),
            ],
            [
                'type' => 'reparation',
                'description' => 'Remplacement de la pièce défectueuse et remise en service.',
                'temps_passe_minutes' => 95,
                'piece_libelle' => null,
                'piece_quantite' => null,
                'cout' => 15000,
                'effectuee_le' => $depart->copy()->addHours(7),
            ],
        ];

        $retenues = array_slice($lignes, 0, $nombre);

        foreach ($retenues as $ligne) {
            InterventionAction::updateOrCreate(
                ['intervention_id' => $intervention->id, 'type' => $ligne['type']],
                $ligne,
            );
        }

        // Elagage : une intervention qui recule d'etape d'un run a l'autre doit perdre
        // les lignes de journal qui ne lui correspondent plus, sinon un dossier a peine
        // planifie trainerait le diagnostic et la piece d'un run precedent.
        $intervention->actions()
            ->whereNotIn('type', array_column($retenues, 'type'))
            ->forceDelete();

        $intervention->recalculerCout();
    }

    /**
     * Phase 09 (multi-tenant) : 2 entreprises actives, chacune avec son propre
     * propriétaire/gérant, appartements, employé, recrutement, paramètres de
     * facturation et un séjour facturé/payé ce mois-ci (pour peupler le tableau de
     * bord Propriétaire) — de quoi vérifier que chaque compte ne voit QUE les
     * données de sa propre entreprise (BelongsToEntreprise/ScopedThroughEntreprise),
     * que l'administrateur les voit toutes, et qu'un compte orphelin (les comptes
     *
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

        // Comptabilite rattachee (Phase 06) : meme raison que le logisticien ci-dessous.
        // compta@laralab.test est orphelin, il ne voit donc aucun fournisseur ni aucune
        // commande — l'ecran Achats ne peut rien lui pre-remplir.
        $userComptaKonan = User::updateOrCreate(
            ['email' => 'compta.konan@laralab.test'],
            ['name' => 'Assi Micheline', 'password' => Hash::make('12345678'), 'role' => 'compta', 'entreprise_id' => $konan->id, 'actif' => true, 'email_verified_at' => now()],
        );
        Employe::updateOrCreate(
            ['user_id' => $userComptaKonan->id],
            ['entreprise_id' => $konan->id, 'nom' => 'Assi', 'prenom' => 'Micheline', 'poste' => 'Comptable', 'date_embauche' => now()->subMonths(5)->toDateString(), 'salaire_base' => null, 'actif' => true],
        );

        // Logistique rattachee (Phase 10) : le compte generique logistique@laralab.test
        // est orphelin (entreprise_id NULL), il ne voit donc que le monde d'avant la
        // Phase 09 — aucun appartement de Konan dans le selecteur "Destination prevue".
        // Celui-ci est le compte a utiliser pour tester le pole sur des donnees reelles.
        $userLogistiqueKonan = User::updateOrCreate(
            ['email' => 'logistique.konan@laralab.test'],
            ['name' => 'Kouassi Fabrice', 'password' => Hash::make('12345678'), 'role' => 'logistique', 'entreprise_id' => $konan->id, 'actif' => true, 'email_verified_at' => now()],
        );
        // La fiche Employe n'est pas decorative : sans elle, Besoin::valide_par_id reste
        // NULL a la validation et la tracabilite du valideur se perd.
        Employe::updateOrCreate(
            ['user_id' => $userLogistiqueKonan->id],
            ['entreprise_id' => $konan->id, 'nom' => 'Kouassi', 'prenom' => 'Fabrice', 'poste' => 'Logisticien', 'date_embauche' => now()->subMonths(3)->toDateString(), 'salaire_base' => null, 'actif' => true],
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

        // Second locataire logistique : sert a verifier de visu que le cloisonnement
        // tient sur la chaine d'approvisionnement (chacun ne voit que ses commandes).
        $userLogistiqueBayo = User::updateOrCreate(
            ['email' => 'logistique.bayo@laralab.test'],
            ['name' => 'Ouattara Salif', 'password' => Hash::make('12345678'), 'role' => 'logistique', 'entreprise_id' => $bayo->id, 'actif' => true, 'email_verified_at' => now()],
        );
        Employe::updateOrCreate(
            ['user_id' => $userLogistiqueBayo->id],
            ['entreprise_id' => $bayo->id, 'nom' => 'Ouattara', 'prenom' => 'Salif', 'poste' => 'Magasinier', 'date_embauche' => now()->subMonths(1)->toDateString(), 'salaire_base' => null, 'actif' => true],
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

    /**
     * La chaîne d'approvisionnement complète (Phase 10), chez Résidences Konan.
     *
     * Chaque état de `Besoin` et de `Commande` est représenté au moins une fois, pour que
     * les cinq écrans aient tous quelque chose à montrer dès le premier chargement — un
     * pôle qui s'ouvre sur cinq écrans vides ne se démontre pas.
     *
     * Les statuts de commande dérivés ne sont JAMAIS écrits ici : on crée de vraies
     * réceptions et on laisse `recalculerStatut()` conclure. Un seeder qui poserait
     * `statut = 'recue'` à la main testerait le seeder, pas l'application.
     */
    private function seedLogistique(): void
    {
        $konan = Entreprise::withoutGlobalScopes()->where('nom', 'Résidences Konan')->first();

        if (! $konan) {
            return;
        }

        $logisticien = Employe::withoutGlobalScopes()
            ->where('entreprise_id', $konan->id)
            ->where('poste', 'Logisticien')
            ->first();

        $apt = Appartement::withoutGlobalScopes()->where('numero', 'K-201')->first();
        $demandeurId = $logisticien?->id;

        $fournisseurs = collect([
            ['nom' => 'Sodeci Équipements', 'contact' => 'M. Traoré', 'telephone' => '0707445566', 'email' => 'commandes@sodeci-equip.test'],
            ['nom' => 'Abidjan Mobilier', 'contact' => 'Mme Koffi', 'telephone' => '0505112233', 'email' => 'contact@abj-mobilier.test'],
        ])->map(fn (array $f) => Fournisseur::updateOrCreate(
            ['nom' => $f['nom'], 'entreprise_id' => $konan->id],
            [...$f, 'adresse' => 'Abidjan', 'actif' => true],
        ));

        // ── Les besoins, un par état du cycle ────────────────────────────────
        $besoins = [];
        foreach ([
            ['designation' => 'Bouilloire électrique 1,7 L', 'quantite' => 4, 'priorite' => 'basse', 'statut' => 'brouillon', 'justification' => 'Renouvellement du petit électroménager des studios.'],
            ['designation' => 'Matelas 160×200', 'quantite' => 2, 'priorite' => 'normale', 'statut' => 'soumis', 'justification' => 'Deux matelas affaissés signalés au dernier état des lieux.'],
            ['designation' => 'Extincteur 6 kg', 'quantite' => 3, 'priorite' => 'haute', 'statut' => 'soumis', 'justification' => 'Mise en conformité incendie avant la visite de contrôle.'],
            ['designation' => 'Climatiseur split 12000 BTU', 'quantite' => 2, 'priorite' => 'haute', 'statut' => 'valide', 'justification' => 'Remplacement des unités réformées en K-201.'],
            ['designation' => 'Table de chevet', 'quantite' => 4, 'priorite' => 'basse', 'statut' => 'valide', 'justification' => 'Complément mobilier des chambres rénovées.'],
            // Volontairement validé et JAMAIS porté sur une commande : sans lui, la file
            // « Validés à commander » serait vide et l'écran Commandes n'aurait rien à
            // proposer au premier chargement.
            ['designation' => 'Ventilateur sur pied', 'quantite' => 5, 'priorite' => 'normale', 'statut' => 'valide', 'justification' => 'Appoint pour la saison sèche, en attente de devis fournisseur.'],
            ['designation' => 'Téléviseur 55 pouces', 'quantite' => 6, 'priorite' => 'normale', 'statut' => 'refuse', 'justification' => 'Montée en gamme du salon.', 'motif_refus' => 'Hors budget ce trimestre — à représenter après les états financiers.'],
        ] as $ligne) {
            $besoin = Besoin::updateOrCreate(
                ['designation' => $ligne['designation'], 'entreprise_id' => $konan->id],
                [
                    'demandeur_employe_id' => $demandeurId,
                    'appartement_id' => $apt?->id,
                    'quantite' => $ligne['quantite'],
                    'justification' => $ligne['justification'],
                    'priorite' => $ligne['priorite'],
                    'statut' => $ligne['statut'],
                    // Toujours écrit, y compris à null : sans cela une relance du seeder
                    // laisserait le motif d'un ancien refus sur un besoin redevenu valide.
                    'motif_refus' => $ligne['motif_refus'] ?? null,
                ],
            );

            $besoin->forceFill($ligne['statut'] === 'valide'
                ? ['valide_par_id' => $demandeurId, 'date_validation' => now()->subDays(4)->toDateString()]
                : ['valide_par_id' => null, 'date_validation' => null],
            )->save();

            $besoins[$ligne['designation']] = $besoin;
        }

        // ── Commande 1 : brouillon, pas encore partie ────────────────────────
        $this->commandeDemo($konan, $fournisseurs[1], 'CMD-DEMO-01', 'brouillon', [
            ['designation' => 'Table de chevet', 'quantite' => 4, 'prix_unitaire' => 35000, 'besoin' => $besoins['Table de chevet']],
        ]);

        // ── Commande 2 : envoyée, en attente de livraison ────────────────────
        $this->commandeDemo($konan, $fournisseurs[0], 'CMD-DEMO-02', 'envoyee', [
            ['designation' => 'Extincteur 6 kg', 'quantite' => 3, 'prix_unitaire' => 45000],
        ], jours: 5);

        // ── Commande 3 : partiellement reçue, avec du reste à enregistrer ────
        $partielle = $this->commandeDemo($konan, $fournisseurs[0], 'CMD-DEMO-03', 'envoyee', [
            ['designation' => 'Climatiseur split 12000 BTU', 'quantite' => 2, 'prix_unitaire' => 250000, 'besoin' => $besoins['Climatiseur split 12000 BTU']],
            ['designation' => 'Support mural climatiseur', 'quantite' => 2, 'prix_unitaire' => 15000],
        ], jours: -2);

        $this->receptionDemo($partielle, $logisticien, now()->subDay(), [
            // La première ligne n'arrive qu'à moitié : c'est ce qui fait basculer la
            // commande en « partiellement reçue », sans qu'aucun statut ne soit écrit.
            ['designation' => 'Climatiseur split 12000 BTU', 'quantite_recue' => 1, 'conforme' => true],
            ['designation' => 'Support mural climatiseur', 'quantite_recue' => 2, 'conforme' => true],
        ]);

        // ── Commande 4 : entièrement reçue, avec un écart, et déjà au parc ───
        $soldee = $this->commandeDemo($konan, $fournisseurs[1], 'CMD-DEMO-04', 'envoyee', [
            ['designation' => 'Matelas 160×200', 'quantite' => 2, 'prix_unitaire' => 120000, 'besoin' => $besoins['Matelas 160×200']],
        ], jours: -9);

        $lignesRecues = $this->receptionDemo($soldee, $logisticien, now()->subDays(7), [
            ['designation' => 'Matelas 160×200', 'quantite_recue' => 2, 'conforme' => false, 'motif_ecart' => 'Housse déchirée sur un des deux matelas.'],
        ]);

        // Une seule des deux pièces entre au parc : l'écran « Enregistrement » doit
        // montrer un reste, sinon on ne voit jamais le compteur travailler.
        if ($ligne = $lignesRecues->first()) {
            for ($i = 0; $i < 1; $i++) {
                Equipement::updateOrCreate(
                    ['reception_ligne_id' => $ligne->id, 'numero_serie' => 'MAT-2026-'.($i + 1)],
                    [
                        'nom' => 'Matelas 160×200',
                        'type' => 'literie',
                        'statut' => 'stock',
                        'date_achat' => now()->subDays(7)->toDateString(),
                        'garantie_fin' => now()->addYears(2)->toDateString(),
                        'contrat_maintenance' => false,
                    ],
                );
            }

            $ligne->forceFill(['quantite_enregistree' => 1])->save();
        }

        $soumis = Besoin::withoutGlobalScopes()->where('entreprise_id', $konan->id)->where('statut', 'soumis')->count();
        $this->command?->info("Logistique prête (Konan) — {$fournisseurs->count()} fournisseurs, ".count($besoins)." besoins dont {$soumis} à valider, 4 commandes couvrant brouillon/envoyée/partiellement reçue/reçue.");
    }

    /**
     * Comptabilité avancée (Phase 06), chez Hôtel Bayo — le seul jeu de données qui
     * traverse trois pôles pour aboutir en compta : un besoin exprimé par la Logistique
     * devient une commande, sa réception une facture fournisseur, et le règlement de
     * cette facture une dépense. Aucun statut dérivé n'est écrit à la main
     * (`Commande::recalculerStatut()`, `FactureFournisseur::valider()/payer()`) — même
     * principe que seedLogistique().
     *
     * Les lignes de facture fournisseur sont en `updateOrCreate` (jamais delete+recreate,
     * contrairement à `genererFactureDemo()`) : un rejeu du seeder ne doit pas changer
     * l'identifiant de la ligne payée, sinon `genererDepenses()` la croirait nouvelle et
     * doublerait la dépense à chaque relance du seeder.
     */
    private function seedAchatsBayo(): void
    {
        $bayo = Entreprise::withoutGlobalScopes()->where('nom', 'Hôtel Bayo')->first();

        if (! $bayo) {
            return;
        }

        $bApt1 = Appartement::withoutGlobalScopes()->where('numero', 'B-301')->first();
        $magasinier = Employe::withoutGlobalScopes()->where('entreprise_id', $bayo->id)->where('poste', 'Magasinier')->first();

        // Compte comptable dédié : même raison que compta.konan@ (voir seedMultiTenant) —
        // compta@laralab.test est orphelin et ne verrait ni fournisseur ni commande de Bayo.
        $userComptaBayo = User::updateOrCreate(
            ['email' => 'compta.bayo@laralab.test'],
            ['name' => 'Kouadio Affoué', 'password' => Hash::make('12345678'), 'role' => 'compta', 'entreprise_id' => $bayo->id, 'actif' => true, 'email_verified_at' => now()],
        );
        $comptable = Employe::updateOrCreate(
            ['user_id' => $userComptaBayo->id],
            ['entreprise_id' => $bayo->id, 'nom' => 'Kouadio', 'prenom' => 'Affoué', 'poste' => 'Comptable', 'date_embauche' => now()->subMonths(3)->toDateString(), 'salaire_base' => null, 'actif' => true],
        );

        // ── Logistique : un besoin de la magasinière devient une commande reçue ──────
        $fournisseurBiens = Fournisseur::updateOrCreate(
            ['nom' => 'Abidjan Hôtellerie Fournitures', 'entreprise_id' => $bayo->id],
            ['contact' => 'M. Yao', 'telephone' => '0708112233', 'email' => 'commandes@abj-hotellerie.test', 'adresse' => 'Abidjan', 'actif' => true],
        );

        $besoinProduits = Besoin::updateOrCreate(
            ['designation' => "Produits d'entretien ménager", 'entreprise_id' => $bayo->id],
            [
                'demandeur_employe_id' => $magasinier?->id,
                'appartement_id' => $bApt1?->id,
                'quantite' => 20,
                'justification' => 'Réapprovisionnement mensuel du stock de nettoyage.',
                'priorite' => 'haute',
                'statut' => 'valide',
                'motif_refus' => null,
            ],
        );
        $besoinProduits->forceFill(['valide_par_id' => $magasinier?->id, 'date_validation' => now()->subDays(10)->toDateString()])->save();

        $commande = $this->commandeDemo($bayo, $fournisseurBiens, 'CMD-BAYO-01', 'envoyee', [
            ['designation' => "Produits d'entretien ménager", 'quantite' => 20, 'prix_unitaire' => 2500, 'besoin' => $besoinProduits],
            ['designation' => 'Aspirateur professionnel', 'quantite' => 1, 'prix_unitaire' => 95000],
        ], jours: -6);

        $lignesRecues = $this->receptionDemo($commande, $magasinier, now()->subDays(4), [
            ['designation' => "Produits d'entretien ménager", 'quantite_recue' => 20, 'conforme' => true],
            ['designation' => 'Aspirateur professionnel', 'quantite_recue' => 1, 'conforme' => true],
        ]);

        // L'aspirateur est un bien durable : il entre au parc, comme tout ce qui
        // traverse la réception logistique.
        if ($ligneAspirateur = $lignesRecues->firstWhere('designation', 'Aspirateur professionnel')) {
            Equipement::updateOrCreate(
                ['reception_ligne_id' => $ligneAspirateur->id, 'numero_serie' => 'ASP-BAYO-2026-01'],
                ['nom' => 'Aspirateur professionnel', 'type' => 'electromenager', 'statut' => 'stock', 'date_achat' => now()->subDays(4)->toDateString(), 'garantie_fin' => now()->addYear()->toDateString(), 'contrat_maintenance' => false],
            );
            $ligneAspirateur->forceFill(['quantite_enregistree' => 1])->save();
        }

        // ── Achats : la facture fournisseur qui règle cette commande. La ligne
        // "produits" est une charge (elle générera une dépense au paiement), la ligne
        // "aspirateur" une immobilisation (elle n'en générera jamais).
        $commandeLigneProduits = $commande->lignes()->where('designation', "Produits d'entretien ménager")->first();
        $commandeLigneAspirateur = $commande->lignes()->where('designation', 'Aspirateur professionnel')->first();

        $achatCommande = FactureFournisseur::updateOrCreate(
            ['entreprise_id' => $bayo->id, 'reference' => 'FF-BAYO-CMD01'],
            [
                'fournisseur_id' => $fournisseurBiens->id,
                'commande_id' => $commande->id,
                'date_facture' => now()->subDays(4)->toDateString(),
                'date_echeance' => now()->addDays(10)->toDateString(),
                'notes' => 'Facture de démonstration liée à la commande CMD-BAYO-01.',
            ],
        );
        FactureFournisseurLigne::updateOrCreate(
            ['facture_fournisseur_id' => $achatCommande->id, 'designation' => "Produits d'entretien ménager"],
            ['commande_ligne_id' => $commandeLigneProduits?->id, 'quantite' => 20, 'prix_unitaire' => 2500, 'nature' => 'charge', 'categorie' => 'achats_consommables'],
        );
        FactureFournisseurLigne::updateOrCreate(
            ['facture_fournisseur_id' => $achatCommande->id, 'designation' => 'Aspirateur professionnel'],
            ['commande_ligne_id' => $commandeLigneAspirateur?->id, 'quantite' => 1, 'prix_unitaire' => 95000, 'nature' => 'immobilisation', 'categorie' => null],
        );
        if ($achatCommande->statut !== 'payee') {
            $achatCommande->valider($comptable->id);
            $achatCommande->payer(now()->subDays(2)->toDateString(), 'virement', 'VIR-BAYO-001');
        }

        // ── Achats : une charge de service, sans aucun lien logistique ───────────────
        $fournisseurServices = Fournisseur::updateOrCreate(
            ['nom' => 'Abidjan Énergie Services', 'entreprise_id' => $bayo->id],
            ['contact' => 'Service clients', 'telephone' => '0505998877', 'email' => 'factures@abj-energie.test', 'adresse' => 'Abidjan', 'actif' => true],
        );
        $achatElectricite = FactureFournisseur::updateOrCreate(
            ['entreprise_id' => $bayo->id, 'reference' => 'FF-BAYO-ELEC-09'],
            [
                'fournisseur_id' => $fournisseurServices->id,
                'commande_id' => null,
                'date_facture' => now()->subDays(5)->toDateString(),
                'date_echeance' => now()->addDays(9)->toDateString(),
                'notes' => "Facture d'électricité de démonstration, sans lien avec la Logistique.",
            ],
        );
        FactureFournisseurLigne::updateOrCreate(
            ['facture_fournisseur_id' => $achatElectricite->id, 'designation' => 'Facture d\'électricité — septembre'],
            ['quantite' => 1, 'prix_unitaire' => 68000, 'nature' => 'charge', 'categorie' => 'courant'],
        );
        if ($achatElectricite->statut !== 'payee') {
            $achatElectricite->valider($comptable->id);
            $achatElectricite->payer(now()->subDays(1)->toDateString(), 'especes');
        }

        // ── Achats : une facture encore en attente, pour peupler la file de validation ──
        $achatAssurance = FactureFournisseur::updateOrCreate(
            ['entreprise_id' => $bayo->id, 'reference' => 'FF-BAYO-ASSUR-01'],
            [
                'fournisseur_id' => null,
                'commande_id' => null,
                'date_facture' => now()->subDay()->toDateString(),
                'date_echeance' => now()->addDays(20)->toDateString(),
                'notes' => 'Prime annuelle assurance locaux, en attente de validation.',
            ],
        );
        FactureFournisseurLigne::updateOrCreate(
            ['facture_fournisseur_id' => $achatAssurance->id, 'designation' => 'Assurance locaux — prime annuelle'],
            ['quantite' => 1, 'prix_unitaire' => 120000, 'nature' => 'charge', 'categorie' => 'impots_taxes'],
        );

        // ── Livre de caisse : une dépense saisie à la main, sans facture fournisseur ──
        Depense::updateOrCreate(
            ['entreprise_id' => $bayo->id, 'libelle' => "Prime exceptionnelle — Agent d'entretien", 'facture_fournisseur_ligne_id' => null],
            ['montant' => 25000, 'date_depense' => now()->subDays(3)->toDateString(), 'categorie' => 'personnel', 'valideur_id' => $comptable->id],
        );
        Depense::updateOrCreate(
            ['entreprise_id' => $bayo->id, 'libelle' => 'Facture SODECI — septembre', 'facture_fournisseur_ligne_id' => null],
            ['montant' => 18500, 'date_depense' => now()->subDays(4)->toDateString(), 'categorie' => 'eau', 'valideur_id' => $comptable->id],
        );
        Depense::updateOrCreate(
            ['entreprise_id' => $bayo->id, 'libelle' => 'Réparation plomberie — Appartement Baya 1', 'facture_fournisseur_ligne_id' => null],
            ['montant' => 32000, 'date_depense' => now()->subDays(2)->toDateString(), 'categorie' => 'reparation', 'valideur_id' => $comptable->id],
        );
        Depense::updateOrCreate(
            ['entreprise_id' => $bayo->id, 'libelle' => 'Contrat entretien mensuel — parties communes', 'facture_fournisseur_ligne_id' => null],
            ['montant' => 15000, 'date_depense' => now()->subDays(6)->toDateString(), 'categorie' => 'entretien', 'valideur_id' => $comptable->id],
        );

        // ── Recouvrement : un second séjour Bayo, clôturé et facturé, jamais soldé ────
        $client = Client::where('email', 'client@laralab.test')->first();

        if ($client && $bApt1) {
            $bRes2 = Reservation::updateOrCreate(
                ['appartement_id' => $bApt1->id, 'client_id' => $client->id, 'date_debut' => now()->subDays(20)->toDateString(), 'date_fin' => now()->subDays(17)->toDateString()],
                ['statut' => 'validee', 'nombre_personnes' => 1],
            );
            $bSejour2 = Sejour::updateOrCreate(
                ['reservation_id' => $bRes2->id],
                ['date_entree' => now()->subDays(20)->toDateString(), 'date_sortie' => now()->subDays(17)->toDateString(), 'etat_lieux_entree' => "État général : Bon\nRAS", 'etat_lieux_sortie' => "État général : Bon\nRAS", 'statut' => 'cloture'],
            );
            $bFacture2 = $this->genererFactureDemo($bSejour2, 'validee', $bayo->id);

            // Un acompte partiel, encaissé mais insuffisant : le solde reste dû ET la
            // facture est déjà en retard (échéance = sortie + 7 jours, ici il y a 10 jours).
            Paiement::updateOrCreate(
                ['facture_id' => $bFacture2->id, 'reference_transaction' => 'DEMO-BAYO-ACOMPTE-'.$bFacture2->id],
                ['montant' => round($bFacture2->montant_ttc * 0.4), 'mode_paiement' => 'mobile_money', 'date_paiement' => now()->subDays(16)],
            );

            Relance::updateOrCreate(
                ['facture_id' => $bFacture2->id, 'date_relance' => now()->subDays(3)->toDateString()],
                ['employe_id' => $comptable->id, 'canal' => 'telephone', 'note' => 'Rappel téléphonique du solde restant dû.', 'solde_restant' => $bFacture2->refresh()->soldeRestant()],
            );
        }

        $this->command?->info('Comptabilité avancée prête (Bayo) — 1 achat logistique réglé (1 charge + 1 immobilisation), 1 achat de service réglé, 1 achat en attente, 1 dépense directe, 1 facture client en retard relancée.');
    }

    /**
     * @param  array<int, array<string, mixed>>  $lignes
     */
    private function commandeDemo(Entreprise $entreprise, Fournisseur $fournisseur, string $reference, string $statut, array $lignes, int $jours = 7): Commande
    {
        // Clé d'idempotence : la référence, explicite et lisible. `Commande::booted()` ne
        // dérive la sienne (CMD-0001) que si le champ est nul, une référence fournie ici
        // n'est donc pas écrasée — et les notes restent une vraie phrase, pas un hachage.
        $commande = Commande::updateOrCreate(
            ['reference' => $reference, 'entreprise_id' => $entreprise->id],
            [
                'fournisseur_id' => $fournisseur->id,
                'date_commande' => now()->subDays(max(1, abs($jours)))->toDateString(),
                'date_livraison_prevue' => now()->addDays($jours)->toDateString(),
                'notes' => 'Commande de démonstration.',
            ],
        );

        // `statut` n'est pas remplissable (règle d'or) : seul forceFill y touche, et
        // uniquement pour les états MANUELS du cycle. Les états dérivés viendront des
        // réceptions.
        $commande->forceFill(['statut' => $statut])->save();

        foreach ($lignes as $ligne) {
            CommandeLigne::updateOrCreate(
                ['commande_id' => $commande->id, 'designation' => $ligne['designation']],
                [
                    'besoin_id' => isset($ligne['besoin']) ? $ligne['besoin']->id : null,
                    'quantite' => $ligne['quantite'],
                    'prix_unitaire' => $ligne['prix_unitaire'],
                ],
            );

            if (isset($ligne['besoin'])) {
                $ligne['besoin']->update(['statut' => 'commande']);
            }
        }

        return $commande;
    }

    /**
     * @param  array<int, array<string, mixed>>  $lignes
     * @return Collection<int, ReceptionLigne>
     */
    private function receptionDemo(Commande $commande, ?Employe $receptionnaire, \DateTimeInterface $date, array $lignes): Collection
    {
        $reception = Reception::updateOrCreate(
            ['commande_id' => $commande->id, 'date_reception' => $date],
            ['receptionnaire_employe_id' => $receptionnaire?->id, 'notes' => 'Livraison de démonstration.'],
        );

        $creees = collect();

        foreach ($lignes as $ligne) {
            $commandeLigne = $commande->lignes()->where('designation', $ligne['designation'])->first();

            if (! $commandeLigne) {
                continue;
            }

            $creees->push(ReceptionLigne::updateOrCreate(
                ['reception_id' => $reception->id, 'commande_ligne_id' => $commandeLigne->id],
                [
                    'quantite_recue' => $ligne['quantite_recue'],
                    'conforme' => $ligne['conforme'],
                    'motif_ecart' => $ligne['motif_ecart'] ?? null,
                ],
            ));
        }

        // Le statut se déduit, il ne se décrète pas — même en données de démonstration.
        $commande->recalculerStatut();

        return $creees;
    }
}
