<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['employe_id', 'date_debut', 'date_fin', 'statut'])]
class Conge extends Model
{
    use SoftDeletes;
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'employe';
    }

    protected function casts(): array
    {
        return [
            'date_debut' => 'date',
            'date_fin' => 'date',
        ];
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }
}
