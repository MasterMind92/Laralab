<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['sejour_id', 'appartement_id', 'partenaire_id', 'designation', 'quantite', 'prix_unitaire', 'statut'])]
class DemandeService extends Model
{
    use Auditable;
    use ScopedThroughEntreprise;
    use SoftDeletes;

    public static function entrepriseRelationPath(): string
    {
        return 'appartement';
    }

    protected $table = 'demandes_service';

    protected function casts(): array
    {
        return [
            'prix_unitaire' => 'decimal:2',
        ];
    }

    public function sejour(): BelongsTo
    {
        return $this->belongsTo(Sejour::class);
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }

    public function partenaire(): BelongsTo
    {
        return $this->belongsTo(Partenaire::class);
    }

    public function montant(): float
    {
        return $this->quantite * (float) $this->prix_unitaire;
    }
}
