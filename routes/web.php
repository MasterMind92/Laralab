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

require __DIR__.'/settings.php';
