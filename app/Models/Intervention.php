<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['equipement_id', 'appartement_id', 'employe_id', 'description_panne', 'date_signalement', 'date_resolution', 'statut'])]
class Intervention extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'date_signalement' => 'datetime',
            'date_resolution' => 'datetime',
        ];
    }

    public function equipement(): BelongsTo
    {
        return $this->belongsTo(Equipement::class);
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }
}
