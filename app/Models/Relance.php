<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Une relance sur une facture client impayée (Phase 06).
 *
 * `solde_restant` est FIGÉ au moment de la relance et jamais recalculé — même principe que
 * `Intervention::$sous_garantie`. Savoir combien restait dû le jour où l'on a relancé est
 * une information historique : si la facture est soldée trois semaines plus tard, une
 * relance qui afficherait « 0 FCFA » ne dirait plus pourquoi elle avait été envoyée.
 */
#[Fillable(['facture_id', 'employe_id', 'date_relance', 'canal', 'note', 'solde_restant'])]
class Relance extends Model
{
    use Auditable;
    use ScopedThroughEntreprise;

    public const CANAUX = ['email', 'telephone', 'courrier', 'sur_place'];

    public static function entrepriseRelationPath(): string
    {
        return 'facture';
    }

    protected $attributes = [
        'canal' => 'email',
        'solde_restant' => 0,
    ];

    protected function casts(): array
    {
        return [
            'date_relance' => 'date',
            'solde_restant' => 'decimal:2',
        ];
    }

    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }
}
