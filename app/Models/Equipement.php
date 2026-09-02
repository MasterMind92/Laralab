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
#[Fillable([
    'nom', 'type', 'icone', 'date_achat', 'statut', 'employe_id', 'appartement_id',
    'numero_serie', 'garantie_fin', 'contrat_maintenance', 'contrat_reference', 'contrat_echeance', 'date_reforme',
    'reception_ligne_id',
])]
class Equipement extends Model
{
    protected function casts(): array
    {
        return [
            'date_achat' => 'date',
            'garantie_fin' => 'date',
            'contrat_maintenance' => 'boolean',
            'contrat_echeance' => 'date',
            'date_reforme' => 'date',
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

    /**
     * D'où vient cette pièce (Phase 10) : la ligne de réception qui l'a fait entrer au
     * parc. Nulle pour tout l'équipement antérieur à la chaîne d'approvisionnement, et
     * pour celui enregistré à la main — ce qui restera toujours légitime.
     */
    public function receptionLigne(): BelongsTo
    {
        return $this->belongsTo(ReceptionLigne::class);
    }

    /**
     * Garantie en cours au moment de l'appel (R7) — distinct de Intervention.sous_garantie,
     * qui fige cette même information au moment où une panne est déclarée et ne doit
     * jamais être recalculée rétroactivement.
     */
    public function estSousGarantie(): bool
    {
        return $this->garantie_fin !== null && $this->garantie_fin->isFuture();
    }

    public function aContratMaintenanceActif(): bool
    {
        return $this->contrat_maintenance && (! $this->contrat_echeance || $this->contrat_echeance->isFuture());
    }
}
