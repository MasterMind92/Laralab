<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    /**
     * Enregistre un encaissement (partiel ou total) sur une facture validée ; la
     * facture passe à 'payee' dès que le cumul des paiements couvre le TTC.
     */
    public function store(Request $request, Facture $facture): RedirectResponse
    {
        if ($facture->statut !== 'validee') {
            return back()->withErrors([
                'facture' => 'Seule une facture validée peut recevoir un paiement.',
            ]);
        }

        $data = $request->validate([
            'montant' => ['required', 'numeric', 'min:0.01', 'max:'.$facture->soldeRestant()],
            'mode_paiement' => ['required', 'in:cb,especes,virement,mobile_money'],
            'reference_transaction' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($facture, $data) {
            $facture->paiements()->create([
                'montant' => $data['montant'],
                'mode_paiement' => $data['mode_paiement'],
                'reference_transaction' => $data['reference_transaction'] ?? null,
                'date_paiement' => now(),
            ]);

            if ($facture->soldeRestant() <= 0) {
                $facture->update(['statut' => 'payee']);
            }
        });

        return back();
    }
}
