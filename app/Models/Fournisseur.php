<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Fournisseur de biens (Phase 10). À ne pas confondre avec `Partenaire`, qui est un
 * catalogue GLOBAL de prestataires géré par l'Administrateur et rendu aux clients via
 * `DemandeService` : celui-ci appartient à une entreprise et ne sert qu'à l'achat.
 */
#[Fillable(['entreprise_id', 'nom', 'contact', 'email', 'telephone', 'adresse', 'actif'])]
class Fournisseur extends Model
{
    use BelongsToEntreprise;
    use SoftDeletes;

    protected $attributes = [
        'actif' => true,
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class);
    }
}
