<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['sejour_id', 'equipement_id', 'description', 'montant'])]
class Dommage extends Model
{
    use ScopedThroughEntreprise;
    use SoftDeletes;

    public static function entrepriseRelationPath(): string
    {
        return 'sejour';
    }

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
        ];
    }

    public function sejour(): BelongsTo
    {
        return $this->belongsTo(Sejour::class);
    }

    public function equipement(): BelongsTo
    {
        return $this->belongsTo(Equipement::class);
    }
}
