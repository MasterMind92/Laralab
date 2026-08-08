<?php

namespace Database\Seeders;

use App\Models\Appartement;
use App\Models\Client;
use App\Models\DemandeService;
use App\Models\Equipement;
use App\Models\Intervention;
use App\Models\Partenaire;
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
        foreach (['proprietaire', 'gerant', 'commercial', 'rh', 'compta', 'logistique', 'maintenance', 'receptionniste'] as $role) {
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
                ['appartement_id' => $a['A-101']->id, 'date_signalement' => now()->subDay(), 'statut' => 'signalee'],
            );
            $equipA101->update(['statut' => 'en_panne']);
        }
        if ($equipA103) {
            Intervention::updateOrCreate(
                ['equipement_id' => $equipA103->id, 'description_panne' => 'Filtration bruyante la nuit'],
                ['appartement_id' => $a['A-103']->id, 'date_signalement' => now()->subDays(3), 'date_resolution' => now()->subDay(), 'statut' => 'resolue'],
            );
        }

        $this->command?->info('Démo prête — client@laralab.test / 12345678 (vérifié), réservations '.
            "en_attente=#{$resEnAttente->id} validee=#{$resValidee->id} en_cours=#{$resEnCours->id}");
    }
}
