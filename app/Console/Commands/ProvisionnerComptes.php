<?php

namespace App\Console\Commands;

use App\Models\Entreprise;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Crée ou resynchronise les comptes internes déclarés dans config/comptes.php.
 *
 * Pensée pour un hébergeur gratuit sans shell : lancée à chaque démarrage du conteneur,
 * elle doit donc être idempotente et ne jamais faire échouer le démarrage — d'où un simple
 * avertissement (et non une erreur) quand le mot de passe n'est pas configuré.
 */
class ProvisionnerComptes extends Command
{
    protected $signature = 'comptes:provisionner';

    protected $description = "Crée ou met à jour les comptes statiques de l'administration (config/comptes.php)";

    public function handle(): int
    {
        $motDePasse = config('comptes.mot_de_passe');

        if (blank($motDePasse)) {
            $this->warn('COMPTES_MOT_DE_PASSE non défini : aucun compte provisionné.');

            return self::SUCCESS;
        }

        $forcer = config('comptes.forcer_mot_de_passe');

        // withTrashed : une entreprise supprimée (soft delete) par erreur est restaurée
        // plutôt que dupliquée — sinon les comptes basculeraient sur une coquille vide.
        $entreprise = Entreprise::withTrashed()->firstOrNew(['nom' => config('comptes.entreprise.nom')]);
        if (! $entreprise->exists) {
            $entreprise->fill([
                'email_contact' => config('comptes.entreprise.email_contact'),
                'statut' => 'active',
                'date_activation' => now(),
            ])->save();
        } elseif ($entreprise->trashed()) {
            $entreprise->restore();
        }

        foreach (config('comptes.profils') as $role => $profil) {
            $user = User::firstOrNew(['email' => $profil['email']]);
            $nouveau = ! $user->exists;

            $user->fill([
                'name' => $profil['name'],
                'role' => $role,
                'entreprise_id' => in_array($role, User::TENANT_EXEMPT_ROLES, true) ? null : $entreprise->id,
                'actif' => true,
            ]);
            $user->email_verified_at ??= now();

            if ($nouveau || $forcer) {
                $user->password = Hash::make($motDePasse);
            }

            $user->save();

            $this->line(sprintf('  %-15s %s %s', $role, $profil['email'], $nouveau ? '(créé)' : '(à jour)'));
        }

        $this->info(count(config('comptes.profils')).' compte(s) provisionné(s).');

        return self::SUCCESS;
    }
}
