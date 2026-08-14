<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['employe_id', 'libelle', 'fait', 'date_realisation', 'ordre'])]
class OnboardingTache extends Model
{
    protected function casts(): array
    {
        return [
            'fait' => 'boolean',
            'date_realisation' => 'date',
        ];
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }
}
