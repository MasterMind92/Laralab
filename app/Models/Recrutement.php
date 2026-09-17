<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'poste', 'departement', 'responsable_id', 'profil_recherche', 'description', 'competences',
    'nombre_postes', 'type_contrat_propose', 'date_souhaitee', 'budget_min', 'budget_max',
    'priorite', 'motif', 'date_limite_candidature', 'lieu', 'statut', 'motif_rejet',
    'valide_par_id', 'date_validation', 'entreprise_id',
])]
class Recrutement extends Model
{
    use Auditable;
    use BelongsToEntreprise;
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'competences' => 'array',
            'date_souhaitee' => 'date',
            'budget_min' => 'decimal:2',
            'budget_max' => 'decimal:2',
            'date_limite_candidature' => 'date',
            'date_validation' => 'date',
        ];
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'responsable_id');
    }

    public function valideur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'valide_par_id');
    }

    public function candidats(): HasMany
    {
        return $this->hasMany(Candidat::class);
    }
}
