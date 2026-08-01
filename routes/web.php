<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;

Route::inertia('/', 'welcome')->name('home');

// Déconnexion en GET pour faciliter les tests manuels multi-rôles (Fortify n'expose que le POST).
// Réservée à l'environnement local : une déconnexion en GET peut être déclenchée involontairement (lien, prefetch).
if (app()->environment('local')) {
    Route::middleware('auth')->get('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout.get');
}

Route::middleware(['auth', 'verified'])->group(function () {
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

    Route::inertia('planning', 'receptionniste/planning')
        ->name('receptionniste.planning')
        ->middleware('role:receptionniste');
});


Route::prefix('portail-client')->group(function(){

    // creer les differentes routes pour les pages du template e-commerce
      
    Route::inertia('/', 'portail-client/HomePage')->name('index.client');
    Route::inertia('appartement/list', 'portail-client/ApartmentListPage')->name('list.appartement.client');
    Route::inertia('appartement/details', 'portail-client/ApartmentDetailPage')->name('detail.appartment.client');
    Route::inertia('login', 'portail-client/LoginPage')->name('login.client');
    Route::inertia('checkout', 'portail-client/CheckoutPage')->name('checkout.client');

});

require __DIR__.'/settings.php';
