<?php

namespace App\Http\Controllers;

use App\Models\Intervention;
use App\Models\InterventionAction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Journal d'actions d'une intervention (Phase 05, R4) : diagnostic, réparation, pose de
 * pièce, contrôle, note. Chaque ligne porte sa date et son coût ; cout_total sur
 * l'intervention en est la somme dérivée, jamais saisie à la main.
 *
 * piece_libelle/piece_quantite restent du texte libre : la frontière Logistique /
 * Comptabilité actée le 2026-08-26 veut que le stock n'existe qu'en Phase 10. La FK se
 * branchera là-dessus sans casser les lignes déjà saisies.
 */
class InterventionActionController extends Controller
{
    public function store(Request $request, Intervention $intervention): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:diagnostic,reparation,piece,controle,note'],
            'description' => ['nullable', 'string'],
            'temps_passe_minutes' => ['nullable', 'integer', 'min:0'],
            'piece_libelle' => ['nullable', 'string', 'max:255'],
            'piece_quantite' => ['nullable', 'integer', 'min:1'],
            'cout' => ['nullable', 'numeric', 'min:0'],
            'effectuee_le' => ['nullable', 'date'],
        ]);

        if (in_array($intervention->etape, Intervention::ETAPES_TERMINALES, true)) {
            throw ValidationException::withMessages([
                'type' => 'Cette intervention est clôturée : son journal ne peut plus être complété.',
            ]);
        }

        if ($data['type'] === 'piece' && blank($data['piece_libelle'] ?? null)) {
            throw ValidationException::withMessages([
                'piece_libelle' => 'Indiquez la pièce posée.',
            ]);
        }

        DB::transaction(function () use ($intervention, $data) {
            $intervention->actions()->create([
                ...$data,
                'cout' => $data['cout'] ?? 0,
                'effectuee_le' => $data['effectuee_le'] ?? now(),
            ]);

            $intervention->recalculerCout();
        });

        return back();
    }

    public function destroy(InterventionAction $action): RedirectResponse
    {
        $intervention = $action->intervention;

        DB::transaction(function () use ($action, $intervention) {
            $action->delete();
            $intervention?->recalculerCout();
        });

        return back();
    }
}
