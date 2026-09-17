<?php

namespace App\Http\Controllers;

use App\Models\Candidat;
use App\Models\Recrutement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CandidatController extends Controller
{
    /**
     * Ajout manuel d'un candidat par le RH (en plus du dépôt auto-service côté portail).
     */
    public function store(Request $request, Recrutement $recrutement): RedirectResponse
    {
        if ($recrutement->statut !== 'validee') {
            return back()->withErrors(['recrutement' => 'Les candidatures ne sont ouvertes que sur un recrutement validé.']);
        }

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'source' => ['nullable', 'in:linkedin,site_web,indeed,autre'],
            'cv' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'lettre_motivation' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        $recrutement->candidats()->create([
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'email' => $data['email'] ?? null,
            'telephone' => $data['telephone'] ?? null,
            'source' => $data['source'] ?? 'autre',
            'cv_path' => $request->hasFile('cv') ? $request->file('cv')->store('candidatures', 'public') : null,
            'lettre_motivation_path' => $request->hasFile('lettre_motivation') ? $request->file('lettre_motivation')->store('candidatures', 'public') : null,
        ]);

        return back();
    }

    /**
     * Transitions du Kanban (etape/statut) + mise à jour des coordonnées et du
     * salaire proposé. Verrouillé dès que le recrutement n'est plus `validee`.
     */
    public function update(Request $request, Candidat $candidat): RedirectResponse
    {
        if ($candidat->recrutement->statut !== 'validee') {
            return back()->withErrors(['candidat' => "Ce recrutement n'accepte plus de modification (clôturé, rejeté ou pas encore validé)."]);
        }

        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'prenom' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'etape' => ['sometimes', 'in:recu,entretien,decision,offre,embauche'],
            'statut' => ['sometimes', 'in:en_cours,rejete,offre_refusee'],
            'salaire_propose' => ['nullable', 'numeric', 'min:0'],
        ]);

        $candidat->update($data);

        return back();
    }

    public function destroy(Candidat $candidat): RedirectResponse
    {
        $candidat->delete();

        return back();
    }
}
