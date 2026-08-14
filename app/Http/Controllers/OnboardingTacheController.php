<?php

namespace App\Http\Controllers;

use App\Models\OnboardingTache;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OnboardingTacheController extends Controller
{
    /**
     * Coche/décoche une tâche de la checklist d'onboarding, posée à l'embauche (règle 4).
     */
    public function update(Request $request, OnboardingTache $onboardingTache): RedirectResponse
    {
        $data = $request->validate([
            'fait' => ['required', 'boolean'],
        ]);

        $onboardingTache->update([
            'fait' => $data['fait'],
            'date_realisation' => $data['fait'] ? now()->toDateString() : null,
        ]);

        return back();
    }
}
