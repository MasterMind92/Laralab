<?php

use App\Http\Controllers\PortailClient\AppartementController;
use App\Http\Controllers\PortailClient\HomeController;
use App\Http\Controllers\PortailClient\PasswordController;
use App\Http\Controllers\PortailClient\RegisterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Portail public
|--------------------------------------------------------------------------
|
| Le portail est la page d'accueil du site. Connexion/inscription/mot de passe
| oublié branchés à l'Étape 4 — le checkout (Étape 5) reste pour l'instant un
| simple Route::inertia.
|
*/

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('appartements', [AppartementController::class, 'index'])->name('list.appartement.client');
Route::get('appartements/{appartement}', [AppartementController::class, 'show'])->name('detail.appartment.client');

Route::inertia('connexion', 'portail-client/LoginPage')->name('login.client');
Route::post('inscription', [RegisterController::class, 'store'])->name('register.client');

// Le POST reste celui de Fortify (/forgot-password, /reset-password) — ces routes
// n'affichent que les pages portail correspondantes.
Route::get('connexion/mot-de-passe-oublie', [PasswordController::class, 'forgot'])->name('password.forgot.client');
Route::get('connexion/reinitialiser-mot-de-passe/{token}', [PasswordController::class, 'reset'])->name('password.reset.client');

// TODO Étape 5 : PortailClient\CheckoutController@index + ReservationController@store (auth + role:client).
Route::inertia('checkout', 'portail-client/CheckoutPage')->name('checkout.client');
