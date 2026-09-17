<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Journal d'actions d'une intervention (R4) : diagnostic, réparation, pose de pièce,
 * contrôle, note libre. piece_libelle/piece_quantite sont de simples champs texte/
 * nombre — pas de FK vers un stock, la Phase 10 (Logistique) n'existe pas encore.
 */
#[Fillable(['intervention_id', 'type', 'description', 'temps_passe_minutes', 'piece_libelle', 'piece_quantite', 'cout', 'effectuee_le'])]
class InterventionAction extends Model
{
    use Auditable;
    use ScopedThroughEntreprise;
    use SoftDeletes;

    protected $table = 'intervention_actions';

    public static function entrepriseRelationPath(): string
    {
        return 'intervention.appartement';
    }

    protected function casts(): array
    {
        return [
            'cout' => 'decimal:2',
            'effectuee_le' => 'datetime',
        ];
    }

    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }
}
