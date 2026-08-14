<?php

namespace App\Http\Controllers;

use App\Models\Employe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LicenciementController extends Controller
{
    /**
     * Licenciement (règle 7 : motif valide + préavis requis) — seul chemin vers
     * Employe.actif = false, appliqué dans la même transaction.
     */
    public function store(Request $request, Employe $employe): RedirectResponse
    {
        if (! $employe->actif) {
            return back()->withErrors(['employe' => "Cet employé n'est déjà plus actif."]);
        }

        $data = $request->validate([
            'motif' => ['required', 'string', 'max:2000'],
            'date_notification' => ['required', 'date'],
            'duree_preavis_jours' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($employe, $data, $request) {
            $employe->licenciements()->create([
                ...$data,
                'decide_par_id' => $request->user()->employe?->id,
            ]);

            $employe->update(['actif' => false]);
        });

        return back();
    }
}
