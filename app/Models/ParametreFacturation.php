<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['frais_service_actif', 'taux_frais_service', 'tva_active', 'taux_tva', 'depot_garantie_defaut', 'delai_restitution_jours', 'entreprise_id'])]
class ParametreFacturation extends Model
{
    use BelongsToEntreprise;

    protected $table = 'parametres_facturation';

    protected function casts(): array
    {
        return [
            'frais_service_actif' => 'boolean',
            'taux_frais_service' => 'decimal:4',
            'tva_active' => 'boolean',
            'taux_tva' => 'decimal:4',
            'depot_garantie_defaut' => 'decimal:2',
        ];
    }

    /**
     * Ligne de paramètres par entreprise (créée avec les valeurs par défaut de la
     * migration au premier appel) — chaque entreprise a ses propres taux TVA/acompte
     * depuis la Phase 09 (multi-tenant), ce réglage n'est plus une ligne globale unique.
     */
    public static function actuel(?int $entrepriseId = null): self
    {
        $entrepriseId ??= auth()->user()?->entreprise_id;

        return static::query()->firstOrCreate(['entreprise_id' => $entrepriseId]);
    }
}
