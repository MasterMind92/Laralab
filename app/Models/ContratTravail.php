<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['employe_id', 'type_contrat', 'salaire', 'date_debut', 'date_fin', 'fichier_contrat', 'candidat_id', 'embauche_par_id'])]
class ContratTravail extends Model
{
    use Auditable;
    use ScopedThroughEntreprise;
    use SoftDeletes;

    public static function entrepriseRelationPath(): string
    {
        return 'employe';
    }

    protected $table = 'contrats_travail';

    protected function casts(): array
    {
        return [
            'salaire' => 'decimal:2',
            'date_debut' => 'date',
            'date_fin' => 'date',
        ];
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class);
    }

    public function embaucheur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'embauche_par_id');
    }
}
