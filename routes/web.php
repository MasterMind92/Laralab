<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('commercial', 'dashboard-commercial')->name('commercial');
    Route::inertia('ressources-humaine', 'dashboard')->name('ressource');
    Route::inertia('client', 'dashboard-client')->name('client');
    Route::inertia('comptabilite', 'dashboard-compta')->name('comptabilite');
    Route::inertia('maintenance', 'dashboard-maintenance')->name('maintenance');
    Route::inertia('logistique', 'dashboard-logistique')->name('logistique');
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
