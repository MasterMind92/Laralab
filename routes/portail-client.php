<?php

use App\Http\Controllers\PortailClient\AppartementController;
use App\Http\Controllers\PortailClient\CheckoutController;
use App\Http\Controllers\PortailClient\HomeController;
use App\Http\Controllers\PortailClient\PasswordController;
use App\Http\Controllers\PortailClient\RegisterController;
use App\Http\Controllers\PortailClient\ReservationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Portail public
|--------------------------------------------------------------------------
|
| Le portail est la page d'accueil du site. Le checkout (Étape 5) est
| réservé aux clients connectés — cf. bootstrap/app.php pour la redirection
| des invités vers /connexion plutôt que /login sur ces routes.
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

Route::middleware(['auth', 'verified', 'role:client'])->group(function () {
    Route::get('checkout', [CheckoutController::class, 'index'])->name('checkout.client');
    Route::post('checkout', [ReservationController::class, 'store'])->name('reservations.store.client');
});
