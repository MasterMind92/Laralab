<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'recrutement_id', 'nom', 'prenom', 'email', 'telephone', 'source',
    'cv_path', 'lettre_motivation_path', 'etape', 'statut', 'salaire_propose',
])]
class Candidat extends Model
{
    use SoftDeletes;
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'recrutement';
    }

    protected function casts(): array
    {
        return [
            'salaire_propose' => 'decimal:2',
        ];
    }

    public function recrutement(): BelongsTo
    {
        return $this->belongsTo(Recrutement::class);
    }

    public function entretiens(): HasMany
    {
        return $this->hasMany(Entretien::class);
    }

    public function contratTravail(): HasOne
    {
        return $this->hasOne(ContratTravail::class);
    }
}
