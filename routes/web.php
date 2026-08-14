<?php

use App\Http\Controllers\AppartementController;
use App\Http\Controllers\CandidatController;
use App\Http\Controllers\CongeController;
use App\Http\Controllers\ContratTravailController;
use App\Http\Controllers\DemandeServiceController;
use App\Http\Controllers\DommageController;
use App\Http\Controllers\EmployeController;
use App\Http\Controllers\EntretienController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\InterventionController;
use App\Http\Controllers\LicenciementController;
use App\Http\Controllers\OnboardingTacheController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\ParametreFacturationController;
use App\Http\Controllers\PartenaireController;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\RecrutementController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\SejourController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;

// Déconnexion en GET pour faciliter les tests manuels multi-rôles (Fortify n'expose que le POST).
// Réservée à l'environnement local : une déconnexion en GET peut être déclenchée involontairement (lien, prefetch).
if (app()->environment('local')) {
    Route::middleware('auth')->get('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout.get');
}

// Back-office interne : le portail public (routes/portail-client.php) occupe désormais l'espace racine.
Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')
        ->name('dashboard')
        ->middleware('role:rh,compta,logistique,maintenance,receptionniste');

    Route::inertia('receptionniste', 'dashboard-commercial')
        ->name('receptionniste')
        ->middleware('role:receptionniste');

    Route::redirect('ressources-humaine', '/admin/employes')
        ->name('ressource')
        ->middleware('role:rh');

    Route::inertia('client', 'dashboard-client')
        ->name('client')
        ->middleware('role:receptionniste');

    Route::inertia('comptabilite', 'dashboard-compta')
        ->name('comptabilite')
        ->middleware('role:compta');

    Route::inertia('maintenance', 'dashboard-maintenance')
        ->name('maintenance')
        ->middleware('role:maintenance');

    Route::inertia('logistique', 'dashboard-logistique')
        ->name('logistique')
        ->middleware('role:logistique');

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
});

// Source HTML pour la génération PDF serveur (Browsershot, Chrome headless) : pas de
// session côté navigateur headless, donc protégée par signature plutôt que par 'auth'.
Route::get('sejours/{sejour}/devis/pdf-source', [FactureController::class, 'pdfSource'])
    ->name('factures.pdf-source')
    ->middleware('signed');

require __DIR__.'/portail-client.php';
require __DIR__.'/portail-recrutement.php';
require __DIR__.'/settings.php';
