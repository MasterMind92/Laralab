<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('commercial', 'dashboard-commercial')->name('commercial');
    Route::inertia('ressources-humaine', 'dashboard')->name('ressource');
    Route::inertia('client', 'dashboard-client')->name('client');
    Route::inertia('proprietaire', 'dashboard-rh')->name('proprietaire');
    Route::inertia('comptabilite', 'dashboard')->name('comptabilite');
});

require __DIR__.'/settings.php';
