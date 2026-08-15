<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Employe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeController extends Controller
{
    use ExportsCsv;

    /**
     * Liste des employés pour le datatable RH, avec le contrat en vigueur
     * (source du salaire affiché — règle 5, salaire_base n'est plus la référence).
     */
    public function index(): Response
    {
        $employes = Employe::with(['onboardingTaches' => fn ($q) => $q->orderBy('ordre'), 'licenciements' => fn ($q) => $q->latest('date_notification')])
            ->orderBy('nom')
            ->get()
            ->map(fn (Employe $e) => $this->toRow($e));

        return Inertia::render('rh/employes', [
            'employes' => $employes,
        ]);
    }

    /**
     * Enregistre un employé saisi directement (hors parcours recrutement — ex. staff déjà en poste).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'poste' => ['required', 'string', 'max:255'],
            'date_embauche' => ['required', 'date'],
            'salaire_base' => ['nullable', 'numeric', 'min:0'],
        ]);

        Employe::create([...$data, 'actif' => true]);

        return back();
    }

    public function update(Request $request, Employe $employe): RedirectResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'poste' => ['required', 'string', 'max:255'],
            'date_embauche' => ['required', 'date'],
        ]);

        $employe->update($data);

        return back();
    }

    /**
     * Supprime (soft delete) une fiche employé — corrige une saisie erronée.
     */
    public function destroy(Employe $employe): RedirectResponse
    {
        $employe->delete();

        return back();
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $employes = Employe::when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('date_embauche', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('date_embauche', '<=', $to))
            ->orderBy('nom')
            ->get();

        return $this->streamCsv(
            'employes.csv',
            ['ID', 'Nom', 'Prénom', 'Poste', 'Date embauche', 'Actif', 'Salaire (contrat en vigueur)'],
            $employes->map(function (Employe $e) {
                $contrat = $e->contratActif();

                return [
                    $e->id,
                    $e->nom,
                    $e->prenom,
                    $e->poste,
                    $e->date_embauche->toDateString(),
                    $e->actif ? 'Oui' : 'Non',
                    $contrat?->salaire ?? '',
                ];
            }),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function toRow(Employe $employe): array
    {
        $contrat = $employe->contratActif();
        $dernierLicenciement = $employe->licenciements->first();

        return [
            'id' => $employe->id,
            'nom' => $employe->nom,
            'prenom' => $employe->prenom,
            'poste' => $employe->poste,
            'date_embauche' => $employe->date_embauche->toDateString(),
            'actif' => $employe->actif,
            'contrat_actif' => $contrat ? [
                'type_contrat' => $contrat->type_contrat,
                'salaire' => $contrat->salaire,
            ] : null,
            'onboarding_taches' => $employe->onboardingTaches->map(fn ($t) => [
                'id' => $t->id,
                'libelle' => $t->libelle,
                'fait' => $t->fait,
            ])->all(),
            'licenciement' => $dernierLicenciement ? [
                'motif' => $dernierLicenciement->motif,
                'date_notification' => $dernierLicenciement->date_notification->toDateString(),
                'date_effective' => $dernierLicenciement->dateEffective()->toDateString(),
            ] : null,
        ];
    }
}
