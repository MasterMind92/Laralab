<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['nom', 'email_contact', 'telephone_contact', 'adresse', 'statut', 'date_activation', 'notes'])]
class Entreprise extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'date_activation' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function appartements(): HasMany
    {
        return $this->hasMany(Appartement::class);
    }

    public function employes(): HasMany
    {
        return $this->hasMany(Employe::class);
    }

    public function recrutements(): HasMany
    {
        return $this->hasMany(Recrutement::class);
    }
}
