<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Volontairement SANS ScopedThroughEntreprise (contrairement a Intervention) : cette
 * table melange deux populations — catalogue (appartement_id NULL, globale, geree par
 * l'Administrateur comme Partenaire) et lignes assignees (appartement_id renseigne,
 * doivent scoper via leur appartement). Un global scope automatique cacherait le
 * catalogue a l'Administrateur. Toute requete listant l'equipement assigne doit
 * explicitement faire ->whereNotNull('appartement_id')->whereHas('appartement') — ce
 * whereHas beneficie quand meme du scope automatique d'Appartement (Phase 09).
 */
#[Fillable(['nom', 'type', 'icone', 'date_achat', 'statut', 'employe_id', 'appartement_id'])]
class Equipement extends Model
{
    protected function casts(): array
    {
        return [
            'date_achat' => 'date',
        ];
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }
}
