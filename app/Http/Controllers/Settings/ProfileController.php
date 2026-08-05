<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Client;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page. Rendu distinct pour un client portail
     * (édite la fiche Client — prénom/nom/téléphone — réellement utilisée par le
     * checkout/les réservations, pas seulement le User.name interne).
     */
    public function edit(Request $request): Response
    {
        if ($request->user()->role === 'client') {
            $client = $request->user()->client;

            return Inertia::render('portail-client/AccountPage', [
                'client' => [
                    'prenom' => $client->prenom ?? '',
                    'nom' => $client->nom ?? '',
                    'email' => $request->user()->email,
                    'telephone' => $client->telephone ?? '',
                ],
                'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
                'status' => $request->session()->get('status'),
            ]);
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Met à jour la fiche Client (prénom/nom/téléphone) et l'e-mail de connexion
     * (User.email, gardé synchronisé avec Client.email comme le fait déjà le checkout).
     * Route distincte de update() : la validation (champs Client, pas User.name) diffère.
     */
    public function updateClient(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'prenom' => ['required', 'string', 'max:255'],
            'nom' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$request->user()->id],
        ]);

        $client = $request->user()->client;
        $client
            ? $client->update(['prenom' => $data['prenom'], 'nom' => $data['nom'], 'telephone' => $data['telephone'] ?? null, 'email' => $data['email']])
            : Client::create(['user_id' => $request->user()->id, ...$data]);

        $user = $request->user();
        $user->name = trim($data['prenom'].' '.$data['nom']);

        if ($user->email !== $data['email']) {
            $user->email = $data['email'];
            $user->email_verified_at = null;
        }

        $user->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('client.profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
