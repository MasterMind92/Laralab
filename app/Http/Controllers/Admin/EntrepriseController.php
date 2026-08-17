<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EntrepriseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/entreprises/index', [
            'entreprises' => Entreprise::withCount(['users', 'appartements', 'employes'])
                ->orderBy('nom')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);

        Entreprise::create($data);

        return back();
    }

    public function update(Request $request, Entreprise $entreprise): RedirectResponse
    {
        $entreprise->update($this->validatedData($request));

        return back();
    }

    public function destroy(Entreprise $entreprise): RedirectResponse
    {
        $entreprise->delete();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request): array
    {
        return $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'email_contact' => ['nullable', 'email', 'max:255'],
            'telephone_contact' => ['nullable', 'string', 'max:20'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'statut' => ['required', 'in:active,suspendue,essai'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
