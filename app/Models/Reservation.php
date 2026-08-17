<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['appartement_id', 'client_id', 'date_debut', 'date_fin', 'statut', 'nombre_personnes', 'notes'])]
class Reservation extends Model
{
    use SoftDeletes;
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'appartement';
    }

    protected function casts(): array
    {
        return [
            'date_debut' => 'date',
            'date_fin' => 'date',
        ];
    }

    /**
     * Réservations actives (en_attente/validee) chevauchant la période donnée pour un appartement.
     */
    public function scopeOverlapping(Builder $query, int $appartementId, string $debut, string $fin): Builder
    {
        return $query
            ->where('appartement_id', $appartementId)
            ->whereIn('statut', ['en_attente', 'validee'])
            ->where('date_debut', '<', $fin)
            ->where('date_fin', '>', $debut);
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function sejour(): HasOne
    {
        return $this->hasOne(Sejour::class);
    }
}
