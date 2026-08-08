<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['frais_service_actif', 'taux_frais_service', 'tva_active', 'taux_tva', 'depot_garantie_defaut', 'delai_restitution_jours'])]
class ParametreFacturation extends Model
{
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
     * Ligne unique de paramètres (créée avec les valeurs par défaut de la migration au premier appel).
     */
    public static function actuel(): self
    {
        return static::query()->firstOrCreate([]);
    }
}
