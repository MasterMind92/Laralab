<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Conge;
use App\Models\Employe;
use App\Notifications\Interne\CongeAValider;
use App\Support\Destinataires;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CongeController extends Controller
{
    use ExportsCsv;

    public function index(): Response
    {
        return Inertia::render('rh/conges', [
            'conges' => Conge::with('employe:id,nom,prenom')->orderByDesc('date_debut')->get(),
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom']),
        ]);
    }

    /**
     * Demande de congé (règle 6 : planifié avant d'être validé).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employe_id' => ['required', 'integer'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['required', 'date', 'after_or_equal:date_debut'],
        ]);

        // Requete cloisonnee plutot que exists: (qui ignore les global scopes) — sinon un
        // conge se cree contre l'employe d'une autre entreprise.
        Employe::findOrFail($data['employe_id']);

        $conge = Conge::create([...$data, 'statut' => 'demande']);

        // Phase 12 : la demande dort jusqu'à ce que quelqu'un ouvre l'écran des congés.
        // L'entreprise se lit sur l'employé, seul porteur direct du rattachement — le
        // congé, lui, n'y est rattaché qu'à travers lui.
        $conge->load('employe');
        Notification::send(
            Destinataires::pourRole('rh', $conge->employe?->entreprise_id),
            new CongeAValider($conge),
        );

        return back();
    }

    /**
     * Validation ou refus (règle 6) — uniquement depuis l'état demande.
     */
    public function update(Request $request, Conge $conge): RedirectResponse
    {
        if ($conge->statut !== 'demande') {
            return back()->withErrors(['conge' => 'Cette demande a déjà été traitée.']);
        }

        $data = $request->validate([
            'statut' => ['required', 'in:valide,refuse'],
        ]);

        $conge->update($data);

        return back();
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $conges = Conge::with('employe:id,nom,prenom')
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('date_debut', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('date_debut', '<=', $to))
            ->orderByDesc('date_debut')
            ->get();

        return $this->streamCsv(
            'conges.csv',
            ['ID', 'Employé', 'Début', 'Fin', 'Statut'],
            $conges->map(fn (Conge $c) => [
                $c->id,
                $c->employe->nom.' '.$c->employe->prenom,
                $c->date_debut->toDateString(),
                $c->date_fin->toDateString(),
                $c->statut,
            ]),
        );
    }
}
