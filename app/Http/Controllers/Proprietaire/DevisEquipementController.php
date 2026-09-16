<?php

namespace App\Http\Controllers\Proprietaire;

use App\Http\Controllers\Controller;
use App\Models\DevisEquipement;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lecture seule (extension Phase 06) : le Propriétaire consulte ce que la plateforme lui
 * facture pour l'équipement acheté pour son compte. Le règlement se fait côté
 * Comptabilité (`ComptabiliteController::payerDevisEquipement`), pas ici.
 */
class DevisEquipementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('proprietaire/devis-equipement', [
            'devis' => DevisEquipement::with(['lignes', 'reception.commande.fournisseur:id,nom'])
                ->orderByDesc('id')
                ->get()
                ->map(fn (DevisEquipement $d) => [
                    'id' => $d->id,
                    'statut' => $d->statut,
                    'montant' => $d->montant(),
                    'date_validation' => $d->date_validation?->toDateString(),
                    'date_paiement' => $d->date_paiement?->toDateString(),
                    'fournisseur' => $d->reception?->commande?->fournisseur?->nom,
                    'commande' => $d->reception?->commande?->reference,
                    'lignes' => $d->lignes->map(fn ($l) => [
                        'designation' => $l->designation,
                        'quantite' => $l->quantite,
                        'montant' => $l->montant(),
                    ]),
                ]),
        ]);
    }
}
