<?php

namespace App\Http\Controllers\PortailRecrutement;

use App\Http\Controllers\Controller;
use App\Models\Recrutement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CandidatureController extends Controller
{
    /**
     * Dépôt de candidature auto-service : ne crée qu'un Candidat (pas de compte
     * utilisateur), toujours source=site_web, uniquement sur une offre publiée.
     */
    public function store(Request $request, Recrutement $recrutement): RedirectResponse
    {
        abort_unless($recrutement->statut === 'validee', 404);

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'cv' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'lettre_motivation' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        $recrutement->candidats()->create([
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'email' => $data['email'],
            'telephone' => $data['telephone'] ?? null,
            'source' => 'site_web',
            'cv_path' => $request->file('cv')->store('candidatures', 'public'),
            'lettre_motivation_path' => $request->hasFile('lettre_motivation')
                ? $request->file('lettre_motivation')->store('candidatures', 'public')
                : null,
        ]);

        return back();
    }
}
