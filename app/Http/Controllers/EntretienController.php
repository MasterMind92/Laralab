<?php

namespace App\Http\Controllers;

use App\Models\Candidat;
use App\Models\Employe;
use App\Models\Entretien;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EntretienController extends Controller
{
    /**
     * Planifie un entretien pour un candidat (règle 2 : le recrutement doit être
     * validé) — fait avancer le candidat de "reçue" à l'étape entretien. Un tour
     * supplémentaire planifié plus tard (candidat déjà en entretien/décision) ne
     * fait pas régresser l'étape.
     */
    public function store(Request $request, Candidat $candidat): RedirectResponse
    {
        if ($candidat->recrutement->statut !== 'validee') {
            return back()->withErrors(['candidat' => "Ce recrutement n'est plus validé."]);
        }

        $data = $request->validate([
            'numero_tour' => ['required', 'integer', 'min:1'],
            'date_entretien' => ['required', 'date'],
            'type' => ['required', 'in:visio,presentiel,telephone'],
            'duree_minutes' => ['nullable', 'integer', 'min:1'],
            'intervieweurs' => ['nullable', 'array'],
            'intervieweurs.*' => ['integer'],
        ]);

        // Requete cloisonnee plutot que exists: (qui ignore les global scopes) —
        // findOrFail() accepte un tableau d'ids et echoue si UN SEUL est hors-tenant.
        if (! empty($data['intervieweurs'])) {
            Employe::findOrFail($data['intervieweurs']);
        }

        $entretien = $candidat->entretiens()->create([
            'numero_tour' => $data['numero_tour'],
            'date_entretien' => $data['date_entretien'],
            'type' => $data['type'],
            'duree_minutes' => $data['duree_minutes'] ?? null,
            'statut' => 'planifie',
        ]);

        if (! empty($data['intervieweurs'])) {
            $entretien->intervieweurs()->sync($data['intervieweurs']);
        }

        if ($candidat->etape === 'recu') {
            $candidat->update(['etape' => 'entretien']);
        }

        return back();
    }

    /**
     * Saisie du résultat d'un entretien : statut de déroulement (réalisé/annulé) et
     * décision (favorable/défavorable/en attente). Une décision défavorable rejette
     * le candidat ; une décision favorable ne fait pas avancer automatiquement l'étape
     * (le RH décide ensuite, via le Kanban, de planifier un tour suivant ou de passer
     * à l'évaluation) pour ne pas présumer du nombre de tours voulu.
     */
    public function update(Request $request, Entretien $entretien): RedirectResponse
    {
        $data = $request->validate([
            'statut' => ['sometimes', 'in:planifie,realise,annule'],
            'decision' => ['nullable', 'in:favorable,defavorable,en_attente'],
            'note' => ['nullable', 'string'],
        ]);

        $entretien->update($data);

        if (($data['decision'] ?? null) === 'defavorable') {
            $entretien->candidat->update(['statut' => 'rejete']);
        }

        return back();
    }

    public function destroy(Entretien $entretien): RedirectResponse
    {
        $entretien->delete();

        return back();
    }
}
