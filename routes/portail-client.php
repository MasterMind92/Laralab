<?php

use App\Http\Controllers\PortailClient\AppartementController;
use App\Http\Controllers\PortailClient\HomeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Portail public
|--------------------------------------------------------------------------
|
| Le portail est la page d'accueil du site (Étape 1). Catalogue réel branché
| à l'Étape 3 — connexion/inscription (Étape 4) et checkout (Étape 5) restent
| pour l'instant de simples Route::inertia.
|
*/

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('appartements', [AppartementController::class, 'index'])->name('list.appartement.client');
Route::get('appartements/{appartement}', [AppartementController::class, 'show'])->name('detail.appartment.client');

// TODO Étape 4 : connexion réelle (POST /login existant) + inscription (POST /inscription) + mot de passe oublié reskinné.
Route::inertia('connexion', 'portail-client/LoginPage')->name('login.client');

// TODO Étape 5 : PortailClient\CheckoutController@index + ReservationController@store (auth + role:client).
Route::inertia('checkout', 'portail-client/CheckoutPage')->name('checkout.client');
