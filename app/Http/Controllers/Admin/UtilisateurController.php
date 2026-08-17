<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUtilisateurRequest;
use App\Models\Employe;
use App\Models\Entreprise;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UtilisateurController extends Controller
{
    /**
     * Filtre manuel explicite (pas de global scope sur User, voir BelongsToEntreprise) :
     * administrateur bypass tous les scopes, donc doit filtrer lui-meme ici.
     */
    public function index(Entreprise $entreprise): Response
    {
        return Inertia::render('admin/entreprises/utilisateurs', [
            'entreprise' => $entreprise,
            'utilisateurs' => User::where('entreprise_id', $entreprise->id)->orderBy('name')->get(),
        ]);
    }

    /**
     * Premiere UI de creation de compte utilisateur du projet — jusqu'ici, seuls les
     * seeders creaient des comptes staff. Cree Employe en meme temps pour les roles
     * autres que proprietaire/gerant (ce sont de vrais employes de l'entreprise).
     */
    public function store(StoreUtilisateurRequest $request, Entreprise $entreprise): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $entreprise) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'entreprise_id' => $entreprise->id,
                'email_verified_at' => now(),
            ]);

            if (! in_array($data['role'], ['proprietaire', 'gerant'], true)) {
                Employe::create([
                    'user_id' => $user->id,
                    'entreprise_id' => $entreprise->id,
                    'nom' => $data['name'],
                    'prenom' => '',
                    'poste' => ucfirst($data['role']),
                    'date_embauche' => now()->toDateString(),
                    'actif' => true,
                ]);
            }
        });

        return back();
    }

    public function update(Request $request, Entreprise $entreprise, User $utilisateur): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$utilisateur->id],
            'role' => ['required', 'in:proprietaire,gerant,rh,compta,logistique,maintenance,receptionniste'],
            'actif' => ['required', 'boolean'],
        ]);

        $utilisateur->update($data);

        return back();
    }

    /**
     * Desactive plutot que supprime un login (coherent avec la suppression douce
     * utilisee partout ailleurs dans ce projet) — voir colonne users.actif.
     */
    public function destroy(Entreprise $entreprise, User $utilisateur): RedirectResponse
    {
        $utilisateur->update(['actif' => false]);

        return back();
    }
}
