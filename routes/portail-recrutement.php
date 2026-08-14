<?php

use App\Http\Controllers\PortailRecrutement\CandidatureController;
use App\Http\Controllers\PortailRecrutement\RecrutementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Portail public de recrutement
|--------------------------------------------------------------------------
|
| Offres publiées (recrutements validés) et dépôt de candidature auto-service,
| sur le même principe que routes/portail-client.php : hors /admin, sans
| authentification.
|
*/

Route::get('carrieres', [RecrutementController::class, 'index'])->name('carrieres.index');
Route::get('carrieres/{recrutement}', [RecrutementController::class, 'show'])->name('carrieres.show');
Route::post('carrieres/{recrutement}/candidater', [CandidatureController::class, 'store'])->name('carrieres.candidater');
