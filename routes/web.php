<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EntrepriseController as AdminEntrepriseController;
use App\Http\Controllers\Admin\PartenaireController as AdminPartenaireController;
use App\Http\Controllers\Admin\UtilisateurController as AdminUtilisateurController;
use App\Http\Controllers\AppartementController;
use App\Http\Controllers\CandidatController;
use App\Http\Controllers\CompetenceController;
use App\Http\Controllers\ComptabiliteController;
use App\Http\Controllers\CongeController;
use App\Http\Controllers\ContratTravailController;
use App\Http\Controllers\DemandeServiceController;
use App\Http\Controllers\DommageController;
use App\Http\Controllers\EmployeController;
use App\Http\Controllers\EntretienController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\InterventionActionController;
use App\Http\Controllers\InterventionController;
use App\Http\Controllers\JournalAuditController;
use App\Http\Controllers\LicenciementController;
use App\Http\Controllers\LogistiqueController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingTacheController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\ParametreFacturationController;
use App\Http\Controllers\ParcEquipementController;
use App\Http\Controllers\PartenaireController;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\Proprietaire\DashboardController as ProprietaireDashboardController;
use App\Http\Controllers\Proprietaire\DevisEquipementController as ProprietaireDevisEquipementController;
use App\Http\Controllers\Proprietaire\EncaissementController as ProprietaireEncaissementController;
use App\Http\Controllers\Proprietaire\EquipementController as ProprietaireEquipementController;
use App\Http\Controllers\Proprietaire\PartenaireController as ProprietairePartenaireController;
use App\Http\Controllers\ReceptionnisteDashboardController;
use App\Http\Controllers\RecrutementController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\RhDashboardController;
use App\Http\Controllers\SejourController;
use App\Http\Controllers\TacheController;
use App\Support\RoleDashboard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;

// Déconnexion en GET pour faciliter les tests manuels multi-rôles (Fortify n'expose que le POST).
// Réservée à l'environnement local : une déconnexion en GET peut être déclenchée involontairement (lien, prefetch).
if (app()->environment('local')) {
    Route::middleware('auth')->get('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout.get');
}

// Back-office interne : le portail public (routes/portail-client.php) occupe désormais l'espace racine.
Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    // Redirecteur universel (Phase 07) : le logo de la sidebar (visible pour tous les
    // roles) et tout ancien lien vers ce nom de route repartent chacun vers LEUR vrai
    // tableau de bord — meme source que LoginResponse, voir RoleDashboard.
    Route::get('dashboard', fn () => redirect(RoleDashboard::route(Auth::user()?->role)))
        ->name('dashboard');

    // Centre de notifications (Phase 12) : transverse a tous les poles, donc sans
    // middleware 'role' — chacun ne voit de toute facon que SES propres notifications,
    // le controleur les resout dans la collection de l'utilisateur connecte.
    Route::get('notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::patch('notifications/tout-lu', [NotificationController::class, 'toutMarquerLu'])
        ->name('notifications.tout-lu');

    // Marque lue puis redirige, en une seule requete : deux visites Inertia lancees coup
    // sur coup s'annulent l'une l'autre.
    Route::get('notifications/{notification}/ouvrir', [NotificationController::class, 'ouvrir'])
        ->name('notifications.ouvrir');

    Route::patch('notifications/{notification}/lue', [NotificationController::class, 'marquerLue'])
        ->name('notifications.lue');

    Route::patch('notifications/{notification}/non-lue', [NotificationController::class, 'marquerNonLue'])
        ->name('notifications.non-lue');

    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])
        ->name('notifications.destroy');

    // Journal d'audit (extension Phase 08) : historique d'une fiche precise, transverse a
    // tous les poles comme les notifications ci-dessus — sans middleware 'role', le scope
    // entreprise de JournalAudit suffit (si l'utilisateur peut ouvrir la fiche, il peut
    // voir son historique).
    Route::get('journal-audit/{type}/{id}', [JournalAuditController::class, 'pourAuditable'])
        ->name('journal-audit.pour-auditable');

    Route::get('receptionniste', [ReceptionnisteDashboardController::class, 'index'])
        ->name('receptionniste')
        ->middleware('role:receptionniste');

    Route::get('rh', [RhDashboardController::class, 'index'])
        ->name('rh')
        ->middleware('role:rh');

    Route::redirect('ressources-humaine', '/admin/employes')
        ->name('ressource')
        ->middleware('role:rh');

    Route::get('comptabilite', [ComptabiliteController::class, 'dashboard'])
        ->name('comptabilite')
        ->middleware('role:compta');

    // Comptabilite avancee (Phase 06, etape B) : les 4 items du menu qui etaient encore
    // des stubs '#'. Middleware pose une seule fois sur le groupe, comme pour les blocs
    // maintenance et logistique.
    Route::middleware('role:compta')->group(function () {
        Route::get('achats', [ComptabiliteController::class, 'achats'])
            ->name('comptabilite.achats');

        Route::post('achats', [ComptabiliteController::class, 'storeAchat'])
            ->name('comptabilite.achats.store');

        Route::patch('achats/{achat}/statut', [ComptabiliteController::class, 'changerStatutAchat'])
            ->name('comptabilite.achats.statut');

        Route::patch('achats/{achat}/paiement', [ComptabiliteController::class, 'payerAchat'])
            ->name('comptabilite.achats.paiement');

        Route::delete('achats/{achat}', [ComptabiliteController::class, 'destroyAchat'])
            ->name('comptabilite.achats.destroy');

        // Devis equipement (extension Phase 06) : genere automatiquement a
        // l'Enregistrement cote Logistique, jamais cree a la main ici.
        Route::get('devis-equipements', [ComptabiliteController::class, 'devisEquipements'])
            ->name('comptabilite.devis-equipements');

        Route::patch('devis-equipements/{devis}/majoration', [ComptabiliteController::class, 'majorerDevisEquipement'])
            ->name('comptabilite.devis-equipements.majoration');

        Route::patch('devis-equipements/{devis}/statut', [ComptabiliteController::class, 'changerStatutDevisEquipement'])
            ->name('comptabilite.devis-equipements.statut');

        Route::patch('devis-equipements/{devis}/paiement', [ComptabiliteController::class, 'payerDevisEquipement'])
            ->name('comptabilite.devis-equipements.paiement');

        // Registre des immobilisations (extension Phase 06) : vue cumulative des lignes
        // 'immobilisation' deja en base, pas de nouvelle table. Declaree avant
        // 'devis-equipements/{devis}' n'est pas necessaire (prefixe different), mais
        // 'export' reste avant toute route parametree par principe.
        Route::get('immobilisations/export', [ComptabiliteController::class, 'exportImmobilisations'])
            ->name('comptabilite.immobilisations.export');

        Route::get('immobilisations', [ComptabiliteController::class, 'immobilisations'])
            ->name('comptabilite.immobilisations');

        // Avances de reservation (extension Phase 06) : isole les acomptes portail
        // aujourd'hui noyes dans Entrees.
        Route::get('avances/export', [ComptabiliteController::class, 'exportAvances'])
            ->name('comptabilite.avances.export');

        Route::get('avances', [ComptabiliteController::class, 'avances'])
            ->name('comptabilite.avances');

        // Le livre de caisse (etape B-bis). 'Depenses' et 'Avances recues' ont ete
        // absorbes : la premiere ne montrait que les charges — donc pas les
        // immobilisations, donc pas la vraie tresorerie — et la seconde ne montrait
        // qu'une des deux sources d'encaissement.
        Route::get('entrees', [ComptabiliteController::class, 'entrees'])
            ->name('comptabilite.entrees');

        Route::get('sorties', [ComptabiliteController::class, 'sorties'])
            ->name('comptabilite.sorties');

        // La saisie directe reste le seul moyen d'ecrire une sortie a la main : celles
        // qui viennent d'une facture sont produites par FactureFournisseur::payer().
        Route::post('sorties', [ComptabiliteController::class, 'storeDepense'])
            ->name('comptabilite.sorties.store');

        Route::put('sorties/{depense}', [ComptabiliteController::class, 'updateDepense'])
            ->name('comptabilite.sorties.update');

        Route::delete('sorties/{depense}', [ComptabiliteController::class, 'destroyDepense'])
            ->name('comptabilite.sorties.destroy');

        Route::get('recouvrements', [ComptabiliteController::class, 'recouvrements'])
            ->name('comptabilite.recouvrements');

        Route::post('recouvrements/{facture}/relances', [ComptabiliteController::class, 'storeRelance'])
            ->name('comptabilite.relances.store');

        Route::get('etats-financiers', [ComptabiliteController::class, 'etatsFinanciers'])
            ->name('comptabilite.etats-financiers');
    });

    // Pole Maintenance (Phase 05, etape B) : les 3 items du menu ont enfin leurs
    // ecrans. Le middleware est pose une seule fois sur le groupe — 'maintenance'
    // reste le nom de la route racine, deja cible par le sidebar.
    Route::middleware('role:maintenance')->group(function () {
        Route::get('maintenance', [MaintenanceController::class, 'dashboard'])
            ->name('maintenance');

        Route::get('maintenance/pannes', [MaintenanceController::class, 'pannes'])
            ->name('maintenance.pannes');

        Route::get('maintenance/interventions', [MaintenanceController::class, 'interventions'])
            ->name('maintenance.interventions');

        // Declaree avant la route parametree : sinon 'export' serait capture comme un id.
        Route::get('maintenance/interventions/export', [MaintenanceController::class, 'export'])
            ->name('maintenance.export');

        Route::get('maintenance/reparations', [MaintenanceController::class, 'reparations'])
            ->name('maintenance.reparations');

        Route::patch('maintenance/interventions/{intervention}/planifier', [MaintenanceController::class, 'planifier'])
            ->name('maintenance.planifier');

        Route::patch('maintenance/interventions/{intervention}/affecter', [MaintenanceController::class, 'affecter'])
            ->name('maintenance.affecter');

        Route::patch('maintenance/interventions/{intervention}/prise-en-charge', [MaintenanceController::class, 'prendreEnCharge'])
            ->name('maintenance.prise-en-charge');

        // Transition generique du workflow, gardee par Intervention::TRANSITIONS.
        Route::patch('maintenance/interventions/{intervention}/etape', [MaintenanceController::class, 'changerEtape'])
            ->name('maintenance.etape');

        // Etape C : deux etapes du workflow exigent une saisie propre et ont donc leur
        // route dediee — la transition generique les refuse explicitement.
        Route::patch('maintenance/interventions/{intervention}/conformite', [MaintenanceController::class, 'testerConformite'])
            ->name('maintenance.conformite');

        Route::patch('maintenance/interventions/{intervention}/reforme', [MaintenanceController::class, 'reformer'])
            ->name('maintenance.reforme');

        Route::post('maintenance/interventions/{intervention}/actions', [InterventionActionController::class, 'store'])
            ->name('maintenance.actions.store');

        Route::delete('maintenance/actions/{action}', [InterventionActionController::class, 'destroy'])
            ->name('maintenance.actions.destroy');

        // R7 : garantie / contrat / numero de serie portent sur l'equipement, pas sur
        // une panne — d'ou un ecran et un controleur a part.
        Route::get('maintenance/parc', [ParcEquipementController::class, 'index'])
            ->name('maintenance.parc');

        Route::get('maintenance/parc/export', [ParcEquipementController::class, 'export'])
            ->name('maintenance.parc.export');

        Route::patch('maintenance/parc/{equipement}', [ParcEquipementController::class, 'update'])
            ->name('maintenance.parc.update');
    });

    // Les ecrans du pole Logistique (Phase 10) : la chaine
    // Besoin -> Commande -> Reception -> Enregistrement -> Affectation. Middleware pose
    // une seule fois sur le groupe, comme pour le bloc maintenance ci-dessus.
    Route::middleware('role:logistique')->group(function () {
        // Etape C : remplace un Route::inertia vers 'dashboard-logistique', page de
        // demonstration entierement en dur. 'logistique' reste le nom de la route racine,
        // deja cible par le sidebar et par les fils d'Ariane des cinq ecrans.
        Route::get('logistique', [LogistiqueController::class, 'dashboard'])
            ->name('logistique');

        Route::get('logistique/besoins', [LogistiqueController::class, 'besoins'])
            ->name('logistique.besoins');

        Route::get('logistique/besoins/export', [LogistiqueController::class, 'exportBesoins'])
            ->name('logistique.besoins.export');

        Route::post('logistique/besoins', [LogistiqueController::class, 'storeBesoin'])
            ->name('logistique.besoins.store');

        Route::put('logistique/besoins/{besoin}', [LogistiqueController::class, 'updateBesoin'])
            ->name('logistique.besoins.update');

        Route::patch('logistique/besoins/{besoin}/statut', [LogistiqueController::class, 'changerStatutBesoin'])
            ->name('logistique.besoins.statut');

        Route::delete('logistique/besoins/{besoin}', [LogistiqueController::class, 'destroyBesoin'])
            ->name('logistique.besoins.destroy');

        Route::get('logistique/commandes', [LogistiqueController::class, 'commandes'])
            ->name('logistique.commandes');

        Route::get('logistique/commandes/export', [LogistiqueController::class, 'exportCommandes'])
            ->name('logistique.commandes.export');

        Route::post('logistique/commandes', [LogistiqueController::class, 'storeCommande'])
            ->name('logistique.commandes.store');

        Route::patch('logistique/commandes/{commande}/statut', [LogistiqueController::class, 'changerStatutCommande'])
            ->name('logistique.commandes.statut');

        Route::post('logistique/fournisseurs', [LogistiqueController::class, 'storeFournisseur'])
            ->name('logistique.fournisseurs.store');

        Route::get('logistique/receptions', [LogistiqueController::class, 'receptions'])
            ->name('logistique.receptions');

        Route::post('logistique/commandes/{commande}/receptions', [LogistiqueController::class, 'storeReception'])
            ->name('logistique.receptions.store');

        Route::get('logistique/enregistrement', [LogistiqueController::class, 'enregistrement'])
            ->name('logistique.enregistrement');

        Route::post('logistique/reception-lignes/{ligne}/enregistrer', [LogistiqueController::class, 'enregistrer'])
            ->name('logistique.enregistrer');

        Route::get('logistique/affectation', [LogistiqueController::class, 'affectation'])
            ->name('logistique.affectation');

        // {equipement} est un simple entier et NON une liaison de modele : `equipements`
        // n'a deliberement aucun scope d'entreprise, la liaison automatique resoudrait
        // donc la piece d'un autre locataire. Le controleur la retrouve lui-meme dans
        // l'inventaire cloisonne du pole.
        Route::patch('logistique/equipements/{equipement}/affectation', [LogistiqueController::class, 'affecter'])
            ->name('logistique.affecter');
    });

    Route::get('planning', [PlanningController::class, 'index'])
        ->name('receptionniste.planning')
        ->middleware('role:receptionniste');

    Route::get('reservations', [ReservationController::class, 'index'])
        ->name('reservations.index')
        ->middleware('role:receptionniste');

    Route::get('reservations/export', [ReservationController::class, 'export'])
        ->name('reservations.export')
        ->middleware('role:receptionniste');

    Route::post('reservations', [ReservationController::class, 'store'])
        ->name('reservations.store')
        ->middleware('role:receptionniste');

    Route::patch('reservations/{reservation}/statut', [ReservationController::class, 'updateStatut'])
        ->name('reservations.update-statut')
        ->middleware('role:receptionniste');

    Route::delete('reservations/{reservation}', [ReservationController::class, 'destroy'])
        ->name('reservations.destroy')
        ->middleware('role:receptionniste');

    Route::get('sejours', [SejourController::class, 'index'])
        ->name('sejours.index')
        ->middleware('role:receptionniste');

    Route::get('sejours/export', [SejourController::class, 'export'])
        ->name('sejours.export')
        ->middleware('role:receptionniste');

    Route::post('sejours', [SejourController::class, 'store'])
        ->name('sejours.store')
        ->middleware('role:receptionniste');

    Route::patch('sejours/{sejour}/checkout', [SejourController::class, 'checkout'])
        ->name('sejours.checkout')
        ->middleware('role:receptionniste');

    Route::delete('sejours/{sejour}', [SejourController::class, 'destroy'])
        ->name('sejours.destroy')
        ->middleware('role:receptionniste');

    Route::get('equipements-suivi', [InterventionController::class, 'index'])
        ->name('receptionniste.equipements')
        ->middleware('role:receptionniste');

    Route::get('equipements-suivi/export', [InterventionController::class, 'export'])
        ->name('interventions.export')
        ->middleware('role:receptionniste');

    Route::post('interventions', [InterventionController::class, 'store'])
        ->name('interventions.store')
        ->middleware('role:receptionniste');

    Route::delete('interventions/{intervention}', [InterventionController::class, 'destroy'])
        ->name('interventions.destroy')
        ->middleware('role:receptionniste');

    Route::get('demandes-service', [DemandeServiceController::class, 'index'])
        ->name('demandes-service.index')
        ->middleware('role:receptionniste');

    Route::get('demandes-service/export', [DemandeServiceController::class, 'export'])
        ->name('demandes-service.export')
        ->middleware('role:receptionniste');

    Route::post('demandes-service', [DemandeServiceController::class, 'store'])
        ->name('demandes-service.store')
        ->middleware('role:receptionniste');

    Route::patch('demandes-service/{demandeService}', [DemandeServiceController::class, 'update'])
        ->name('demandes-service.update')
        ->middleware('role:receptionniste');

    Route::delete('demandes-service/{demandeService}', [DemandeServiceController::class, 'destroy'])
        ->name('demandes-service.destroy')
        ->middleware('role:receptionniste');

    Route::post('partenaires', [PartenaireController::class, 'store'])
        ->name('partenaires.store')
        ->middleware('role:receptionniste');

    Route::get('devis', [FactureController::class, 'index'])
        ->name('receptionniste.devis')
        ->middleware('role:receptionniste');

    Route::post('sejours/{sejour}/devis', [FactureController::class, 'generer'])
        ->name('factures.generer')
        ->middleware('role:receptionniste');

    Route::get('sejours/{sejour}/devis/imprimer', [FactureController::class, 'imprimer'])
        ->name('factures.imprimer')
        ->middleware('role:receptionniste,compta');

    Route::get('sejours/{sejour}/devis/telecharger', [FactureController::class, 'telechargerPdf'])
        ->name('factures.telecharger')
        ->middleware('role:receptionniste,compta');

    Route::get('factures', [FactureController::class, 'indexCompta'])
        ->name('factures.index')
        ->middleware('role:compta');

    Route::patch('factures/{facture}/valider', [FactureController::class, 'valider'])
        ->name('factures.valider')
        ->middleware('role:compta');

    Route::patch('factures/{facture}/rejeter', [FactureController::class, 'rejeter'])
        ->name('factures.rejeter')
        ->middleware('role:compta');

    Route::post('factures/{facture}/paiements', [PaiementController::class, 'store'])
        ->name('paiements.store')
        ->middleware('role:compta');

    Route::post('sejours/{sejour}/dommages', [DommageController::class, 'store'])
        ->name('dommages.store')
        ->middleware('role:receptionniste');

    Route::delete('dommages/{dommage}', [DommageController::class, 'destroy'])
        ->name('dommages.destroy')
        ->middleware('role:receptionniste');

    // Catalogue des appartements : réservé à proprietaire/gerant (accès total via EnsureUserHasRole).
    Route::resource('appartements', AppartementController::class)
        ->except(['create', 'edit', 'show'])
        ->middleware('role:proprietaire');

    Route::get('employes', [EmployeController::class, 'index'])
        ->name('employes.index')
        ->middleware('role:rh');

    Route::get('employes/export', [EmployeController::class, 'export'])
        ->name('employes.export')
        ->middleware('role:rh');

    Route::post('employes', [EmployeController::class, 'store'])
        ->name('employes.store')
        ->middleware('role:rh');

    Route::put('employes/{employe}', [EmployeController::class, 'update'])
        ->name('employes.update')
        ->middleware('role:rh');

    Route::delete('employes/{employe}', [EmployeController::class, 'destroy'])
        ->name('employes.destroy')
        ->middleware('role:rh');

    Route::post('competences', [CompetenceController::class, 'store'])
        ->name('competences.store')
        ->middleware('role:rh');

    // Phase 11 : vue journaliere de planification des taches d'entretien.
    Route::get('planification', [TacheController::class, 'index'])
        ->name('planification.index')
        ->middleware('role:rh');

    Route::post('planification', [TacheController::class, 'store'])
        ->name('planification.store')
        ->middleware('role:rh');

    Route::patch('planification/{tache}/assigner', [TacheController::class, 'assigner'])
        ->name('planification.assigner')
        ->middleware('role:rh');

    // Transition generique du cycle, gardee par Tache::TRANSITIONS.
    Route::patch('planification/{tache}/statut', [TacheController::class, 'changerStatut'])
        ->name('planification.statut')
        ->middleware('role:rh');

    Route::delete('planification/{tache}', [TacheController::class, 'destroy'])
        ->name('planification.destroy')
        ->middleware('role:rh');

    Route::get('recrutements', [RecrutementController::class, 'index'])
        ->name('recrutements.index')
        ->middleware('role:rh');

    Route::get('recrutements/export', [RecrutementController::class, 'export'])
        ->name('recrutements.export')
        ->middleware('role:rh');

    Route::post('recrutements', [RecrutementController::class, 'store'])
        ->name('recrutements.store')
        ->middleware('role:rh');

    Route::get('recrutements/{recrutement}', [RecrutementController::class, 'show'])
        ->name('recrutements.show')
        ->middleware('role:rh');

    Route::put('recrutements/{recrutement}', [RecrutementController::class, 'update'])
        ->name('recrutements.update')
        ->middleware('role:rh');

    Route::patch('recrutements/{recrutement}/soumettre', [RecrutementController::class, 'soumettre'])
        ->name('recrutements.soumettre')
        ->middleware('role:rh');

    Route::patch('recrutements/{recrutement}/valider', [RecrutementController::class, 'valider'])
        ->name('recrutements.valider')
        ->middleware('role:rh');

    Route::patch('recrutements/{recrutement}/rejeter', [RecrutementController::class, 'rejeter'])
        ->name('recrutements.rejeter')
        ->middleware('role:rh');

    Route::patch('recrutements/{recrutement}/cloturer', [RecrutementController::class, 'cloturer'])
        ->name('recrutements.cloturer')
        ->middleware('role:rh');

    Route::post('recrutements/{recrutement}/candidats', [CandidatController::class, 'store'])
        ->name('candidats.store')
        ->middleware('role:rh');

    Route::patch('candidats/{candidat}', [CandidatController::class, 'update'])
        ->name('candidats.update')
        ->middleware('role:rh');

    Route::delete('candidats/{candidat}', [CandidatController::class, 'destroy'])
        ->name('candidats.destroy')
        ->middleware('role:rh');

    Route::post('candidats/{candidat}/entretiens', [EntretienController::class, 'store'])
        ->name('entretiens.store')
        ->middleware('role:rh');

    Route::patch('entretiens/{entretien}', [EntretienController::class, 'update'])
        ->name('entretiens.update')
        ->middleware('role:rh');

    Route::delete('entretiens/{entretien}', [EntretienController::class, 'destroy'])
        ->name('entretiens.destroy')
        ->middleware('role:rh');

    Route::get('contrats', [ContratTravailController::class, 'index'])
        ->name('contrats.index')
        ->middleware('role:rh');

    Route::get('contrats/export', [ContratTravailController::class, 'export'])
        ->name('contrats.export')
        ->middleware('role:rh');

    Route::post('contrats', [ContratTravailController::class, 'store'])
        ->name('contrats.store')
        ->middleware('role:rh');

    Route::put('contrats/{contratTravail}', [ContratTravailController::class, 'update'])
        ->name('contrats.update')
        ->middleware('role:rh');

    Route::delete('contrats/{contratTravail}', [ContratTravailController::class, 'destroy'])
        ->name('contrats.destroy')
        ->middleware('role:rh');

    Route::post('candidats/{candidat}/embaucher', [ContratTravailController::class, 'embaucher'])
        ->name('candidats.embaucher')
        ->middleware('role:rh');

    Route::get('conges', [CongeController::class, 'index'])
        ->name('conges.index')
        ->middleware('role:rh');

    Route::get('conges/export', [CongeController::class, 'export'])
        ->name('conges.export')
        ->middleware('role:rh');

    Route::post('conges', [CongeController::class, 'store'])
        ->name('conges.store')
        ->middleware('role:rh');

    Route::patch('conges/{conge}', [CongeController::class, 'update'])
        ->name('conges.update')
        ->middleware('role:rh');

    Route::post('employes/{employe}/licenciement', [LicenciementController::class, 'store'])
        ->name('licenciements.store')
        ->middleware('role:rh');

    Route::patch('onboarding-taches/{onboardingTache}', [OnboardingTacheController::class, 'update'])
        ->name('onboarding-taches.update')
        ->middleware('role:rh');

    Route::get('parametres-facturation', [ParametreFacturationController::class, 'edit'])
        ->name('parametres-facturation.edit')
        ->middleware('role:compta');

    Route::put('parametres-facturation', [ParametreFacturationController::class, 'update'])
        ->name('parametres-facturation.update')
        ->middleware('role:compta');

    // Provisioning Administrateur (Phase 09, multi-tenant) — namespace App\Http\Controllers\Admin.
    Route::middleware('role:administrateur')->group(function () {
        Route::get('administrateur', [AdminDashboardController::class, 'index'])
            ->name('admin.dashboard');

        Route::get('entreprises', [AdminEntrepriseController::class, 'index'])
            ->name('admin.entreprises.index');

        Route::post('entreprises', [AdminEntrepriseController::class, 'store'])
            ->name('admin.entreprises.store');

        Route::put('entreprises/{entreprise}', [AdminEntrepriseController::class, 'update'])
            ->name('admin.entreprises.update');

        Route::delete('entreprises/{entreprise}', [AdminEntrepriseController::class, 'destroy'])
            ->name('admin.entreprises.destroy');

        Route::prefix('entreprises/{entreprise}')->group(function () {
            Route::get('appartements', [AppartementController::class, 'indexPourEntreprise'])
                ->name('admin.appartements.index');

            Route::post('appartements', [AppartementController::class, 'storePourEntreprise'])
                ->name('admin.appartements.store');

            Route::get('utilisateurs', [AdminUtilisateurController::class, 'index'])
                ->name('admin.utilisateurs.index');

            Route::post('utilisateurs', [AdminUtilisateurController::class, 'store'])
                ->name('admin.utilisateurs.store');

            Route::put('utilisateurs/{utilisateur}', [AdminUtilisateurController::class, 'update'])
                ->name('admin.utilisateurs.update');

            Route::delete('utilisateurs/{utilisateur}', [AdminUtilisateurController::class, 'destroy'])
                ->name('admin.utilisateurs.destroy');
        });

        Route::get('admin-partenaires', [AdminPartenaireController::class, 'index'])
            ->name('admin.partenaires.index');

        Route::post('admin-partenaires', [AdminPartenaireController::class, 'store'])
            ->name('admin.partenaires.store');

        Route::put('admin-partenaires/{partenaire}', [AdminPartenaireController::class, 'update'])
            ->name('admin.partenaires.update');

        Route::delete('admin-partenaires/{partenaire}', [AdminPartenaireController::class, 'destroy'])
            ->name('admin.partenaires.destroy');

        // Journal d'audit (extension Phase 08) : vue Direction. Export avant la route
        // simple par principe (aucun conflit ici, pas de segment parametre, mais on garde
        // la convention du projet).
        Route::get('journal-audit/export', [JournalAuditController::class, 'export'])
            ->name('journal-audit.export');

        Route::get('journal-audit', [JournalAuditController::class, 'index'])
            ->name('journal-audit.index');
    });

    // Tableaux de bord Propriétaire/Gérant, scopés à leur entreprise (Phase 09).
    Route::middleware('role:proprietaire,gerant')->group(function () {
        Route::get('proprietaire', [ProprietaireDashboardController::class, 'index'])
            ->name('proprietaire.dashboard');

        Route::get('encaissements', [ProprietaireEncaissementController::class, 'index'])
            ->name('proprietaire.encaissements.index');

        Route::get('encaissements/export', [ProprietaireEncaissementController::class, 'export'])
            ->name('proprietaire.encaissements.export');

        Route::get('equipements-statut', [ProprietaireEquipementController::class, 'index'])
            ->name('proprietaire.equipements.index');

        Route::get('partenaires-catalogue', [ProprietairePartenaireController::class, 'index'])
            ->name('proprietaire.partenaires.index');

        // Journal d'audit (extension Phase 08) : meme requete que la vue administrateur,
        // scopee automatiquement a l'entreprise du proprietaire/gerant connecte. Methode
        // dediee (indexProprietaire) plutot qu'une 2e route sur index() : meme contrainte
        // Wayfinder que ComptabiliteController::immobilisationsProprietaire().
        Route::get('mon-journal-audit', [JournalAuditController::class, 'indexProprietaire'])
            ->name('journal-audit.index-proprietaire');

        Route::get('mon-journal-audit/export', [JournalAuditController::class, 'exportProprietaire'])
            ->name('journal-audit.export-proprietaire');

        // Extension Phase 06 : lecture seule, le reglement se fait cote Comptabilite.
        Route::get('mes-devis-equipement', [ProprietaireDevisEquipementController::class, 'index'])
            ->name('proprietaire.devis-equipements.index');

        // Meme controleur/requete que la Comptabilite (acces confirme en lecture seule),
        // via une methode dediee : Wayfinder generait un export ambigu si le meme nom de
        // methode servait /admin/immobilisations ET /admin/mes-immobilisations.
        Route::get('mes-immobilisations', [ComptabiliteController::class, 'immobilisationsProprietaire'])
            ->name('proprietaire.immobilisations.index');
    });
});

// Source HTML pour la génération PDF serveur (Browsershot, Chrome headless) : pas de
// session côté navigateur headless, donc protégée par signature plutôt que par 'auth'.
Route::get('sejours/{sejour}/devis/pdf-source', [FactureController::class, 'pdfSource'])
    ->name('factures.pdf-source')
    ->middleware('signed');

require __DIR__.'/portail-client.php';
require __DIR__.'/portail-recrutement.php';
require __DIR__.'/settings.php';
