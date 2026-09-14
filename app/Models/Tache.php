<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'appartement_id', 'reservation_id', 'employe_assigne_id', 'type', 'origine',
    'priorite', 'date_prevue', 'statut', 'notes',
])]
class Tache extends Model
{
    use ScopedThroughEntreprise;
    use SoftDeletes;

    public const TYPES = ['nettoyage', 'linge', 'reassort', 'controle_general'];

    public const STATUTS = ['a_faire', 'en_cours', 'terminee', 'controlee'];

    public const STATUTS_TERMINAUX = ['controlee'];

    /**
     * Source de verite unique du cycle (Phase 11, meme principe qu'Intervention::TRANSITIONS) :
     * le retour terminee -> en_cours couvre un controle qui echoue.
     */
    public const TRANSITIONS = [
        'a_faire' => ['en_cours'],
        'en_cours' => ['terminee'],
        'terminee' => ['controlee', 'en_cours'],
        'controlee' => [],
    ];

    public static function entrepriseRelationPath(): string
    {
        return 'appartement';
    }

    protected function casts(): array
    {
        return [
            'date_prevue' => 'datetime',
        ];
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function employeAssigne(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'employe_assigne_id');
    }

    public function peutPasserA(string $statut): bool
    {
        return in_array($statut, self::TRANSITIONS[$this->statut] ?? [], true);
    }
}
