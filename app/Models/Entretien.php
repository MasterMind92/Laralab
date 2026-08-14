<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['candidat_id', 'numero_tour', 'date_entretien', 'type', 'duree_minutes', 'statut', 'decision', 'note'])]
class Entretien extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'date_entretien' => 'datetime',
        ];
    }

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class);
    }

    public function intervieweurs(): BelongsToMany
    {
        return $this->belongsToMany(Employe::class, 'entretien_intervieweur');
    }
}
