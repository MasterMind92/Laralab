<?php

use App\Http\Controllers\AppartementController;
use App\Http\Controllers\ParametreFacturationController;
use App\Http\Controllers\PlanningController;
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

    Route::inertia('ressources-humaine', 'dashboard')
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

    Route::post('reservations', [ReservationController::class, 'store'])
        ->name('reservations.store')
        ->middleware('role:receptionniste');

    Route::post('sejours', [SejourController::class, 'store'])
        ->name('sejours.store')
        ->middleware('role:receptionniste');

    // Catalogue des appartements : réservé à proprietaire/gerant (accès total via EnsureUserHasRole).
    Route::resource('appartements', AppartementController::class)
        ->except(['create', 'edit', 'show'])
        ->middleware('role:proprietaire');

    Route::get('parametres-facturation', [ParametreFacturationController::class, 'edit'])
        ->name('parametres-facturation.edit')
        ->middleware('role:compta');

    Route::put('parametres-facturation', [ParametreFacturationController::class, 'update'])
        ->name('parametres-facturation.update')
        ->middleware('role:compta');
});

require __DIR__.'/portail-client.php';
require __DIR__.'/settings.php';
