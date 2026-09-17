<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Réception physique d'une commande (Phase 10).
 *
 * Une commande peut en porter plusieurs : c'est ce qui rend la livraison partielle
 * représentable sans écraser la précédente. Chaque réception s'ajoute aux autres, jamais
 * ne les corrige — d'où l'absence de statut ici, c'est la commande qui en dérive le sien.
 */
#[Fillable(['commande_id', 'receptionnaire_employe_id', 'date_reception', 'notes'])]
class Reception extends Model
{
    use Auditable;
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'commande';
    }

    protected function casts(): array
    {
        return [
            'date_reception' => 'date',
        ];
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class);
    }

    public function receptionnaire(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'receptionnaire_employe_id');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(ReceptionLigne::class);
    }

    /** Vrai dès qu'une ligne au moins s'écarte de ce qui était commandé. */
    public function presenteUnEcart(): bool
    {
        return $this->lignes->contains(fn (ReceptionLigne $ligne) => $ligne->presenteUnEcart());
    }
}
