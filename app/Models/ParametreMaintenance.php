<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'entreprise_id', 'sla_critique_heures', 'sla_haute_heures', 'sla_normale_heures', 'sla_basse_heures',
    'heure_ouverture', 'heure_fermeture', 'jours_ouvres', 'seuil_reforme',
])]
class ParametreMaintenance extends Model
{
    use BelongsToEntreprise;

    protected $table = 'parametres_maintenance';

    protected function casts(): array
    {
        return [
            'jours_ouvres' => 'array',
            'seuil_reforme' => 'decimal:2',
        ];
    }

    /**
     * Ligne de paramètres par entreprise (même pattern que ParametreFacturation::actuel()
     * depuis la Phase 09 — jamais de singleton global). Les valeurs par défaut sont
     * passées explicitement (pas seulement au niveau de la migration) : à la toute
     * première création, l'instance en mémoire renvoyée par firstOrCreate() n'aurait
     * sinon connaissance que des colonnes réellement écrites dans l'INSERT — les
     * valeurs par défaut MySQL des autres colonnes existent bien en base mais
     * resteraient null côté PHP tant qu'un ->fresh() n'est pas fait.
     */
    public static function actuel(?int $entrepriseId = null): self
    {
        $entrepriseId ??= auth()->user()?->entreprise_id;

        return static::query()->firstOrCreate(
            ['entreprise_id' => $entrepriseId],
            [
                'sla_critique_heures' => 1,
                'sla_haute_heures' => 2,
                'sla_normale_heures' => 8,
                'sla_basse_heures' => 24,
                'heure_ouverture' => '08:00:00',
                'heure_fermeture' => '18:00:00',
                'jours_ouvres' => [1, 2, 3, 4, 5],
                'seuil_reforme' => 150000,
            ],
        );
    }

    public function heuresPour(string $priorite): int
    {
        return match ($priorite) {
            'critique' => $this->sla_critique_heures,
            'haute' => $this->sla_haute_heures,
            'basse' => $this->sla_basse_heures,
            default => $this->sla_normale_heures,
        };
    }
}
