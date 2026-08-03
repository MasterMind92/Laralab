<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Portail public
|--------------------------------------------------------------------------
|
| Le portail devient la page d'accueil du site (Étape 1). Les pages ci-dessous
| sont pour l'instant de simples Route::inertia (comportement inchangé, données
| encore fictives) — les vrais contrôleurs arrivent à l'Étape 3 (catalogue),
| l'Étape 4 (compte client) et l'Étape 5 (checkout).
|
*/

// TODO Étape 3 : remplacer par PortailClient\HomeController et retirer welcome.tsx.
Route::inertia('/', 'welcome')->name('home');

// TODO Étape 3 : PortailClient\AppartementController@index/@show (catalogue réel + disponibilité).
Route::inertia('appartements', 'portail-client/ApartmentListPage')->name('list.appartement.client');
Route::inertia('appartements/{appartement}', 'portail-client/ApartmentDetailPage')->name('detail.appartment.client');

// TODO Étape 4 : connexion réelle (POST /login existant) + inscription (POST /inscription) + mot de passe oublié reskinné.
Route::inertia('connexion', 'portail-client/LoginPage')->name('login.client');

// TODO Étape 5 : PortailClient\CheckoutController@index + ReservationController@store (auth + role:client).
Route::inertia('checkout', 'portail-client/CheckoutPage')->name('checkout.client');
