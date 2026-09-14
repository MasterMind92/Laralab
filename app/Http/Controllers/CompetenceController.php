<?php

namespace App\Http\Controllers;

use App\Models\Competence;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CompetenceController extends Controller
{
    /**
     * Creation a la volee depuis la fiche employe (Phase 11) — pas d'ecran
     * d'administration dedie, le vocabulaire s'etend au fil des besoins du RH.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'libelle' => ['required', 'string', 'max:255'],
        ]);

        Competence::firstOrCreate(['libelle' => $data['libelle']]);

        return back();
    }
}
