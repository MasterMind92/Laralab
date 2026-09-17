<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string $role
 * @property int|null $entreprise_id
 * @property bool $actif
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'entreprise_id', 'actif'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Roles qui n'ont structurellement jamais d'entreprise_id : administrateur (accès
     * global, vendeur) et client (réserve sur des appartements de n'importe quelle
     * entreprise via le portail public — jamais tenant-scopé). Utilisé par
     * BelongsToEntreprise/ScopedThroughEntreprise pour décider quand filtrer
     * (Phase 09, multi-tenant) — source unique pour éviter la duplication.
     */
    public const TENANT_EXEMPT_ROLES = ['administrateur', 'client'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'actif' => 'boolean',
        ];
    }

    public function employe(): HasOne
    {
        return $this->hasOne(Employe::class);
    }

    public function client(): HasOne
    {
        return $this->hasOne(Client::class);
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class);
    }

    public function isAdministrateur(): bool
    {
        return $this->role === 'administrateur';
    }

    /**
     * proprietaire/gerant : bypass tous les pôles (middleware), mais restent
     * filtrés par entreprise au niveau des données (global scopes) — distinct
     * d'isAdministrateur() qui bypass aussi le filtrage des données.
     */
    public function hasFullAccessToEntreprise(): bool
    {
        return in_array($this->role, ['proprietaire', 'gerant'], true);
    }
}
