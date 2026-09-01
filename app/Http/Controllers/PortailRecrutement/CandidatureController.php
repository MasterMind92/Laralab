<?php

namespace App\Http\Controllers\PortailRecrutement;

use App\Http\Controllers\Controller;
use App\Models\Recrutement;
use App\Notifications\Interne\CandidatureRecue;
use App\Support\Destinataires;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

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

        $candidat = $recrutement->candidats()->create([
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

        // Phase 12 : dépôt auto-service, personne du côté RH n'est dans la boucle au
        // moment où il se produit.
        $candidat->setRelation('recrutement', $recrutement);
        Notification::send(
            Destinataires::pourRole('rh', $recrutement->entreprise_id),
            new CandidatureRecue($candidat),
        );

        return back();
    }
}
