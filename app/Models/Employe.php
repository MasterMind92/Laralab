<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'user_id', 'nom', 'prenom', 'poste', 'date_embauche', 'salaire_base', 'actif',
    'entreprise_id', 'jours_travailles',
])]
class Employe extends Model
{
    use BelongsToEntreprise;
    use HasFactory;
    use SoftDeletes;

    /**
     * Mots-clés identifiant un poste de technicien du pôle Maintenance, pour ne proposer
     * qu'eux à l'affectation d'une intervention (Phase 05).
     *
     * Filtrage par MOTS-CLÉS et non par liste fermée d'intitulés, parce que `poste` est
     * un champ texte libre saisi par les RH (décision actée le 2026-08-26 : les rôles
     * métiers sont des valeurs de `poste`, pas des rôles système). Une liste fermée
     * ferait silencieusement disparaître du sélecteur tout intitulé légitime mais non
     * prévu — « Technicienne CVC », « Chargé de maintenance », « Technicien polyvalent ».
     * Conséquence à connaître : un poste sans aucun de ces mots (ex. « Plombier ») ne
     * sera PAS proposé ; c'est l'intitulé RH qu'il faut alors ajuster, ou cette liste.
     */
    public const MOTSCLES_POSTE_MAINTENANCE = ['technicien', 'maintenance'];

    protected function casts(): array
    {
        return [
            'date_embauche' => 'date',
            'salaire_base' => 'decimal:2',
            'actif' => 'boolean',
            'jours_travailles' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contratsTravail(): HasMany
    {
        return $this->hasMany(ContratTravail::class);
    }

    public function conges(): HasMany
    {
        return $this->hasMany(Conge::class);
    }

    public function equipements(): HasMany
    {
        return $this->hasMany(Equipement::class);
    }

    /**
     * Les employés affectables à une intervention de maintenance — voir
     * MOTSCLES_POSTE_MAINTENANCE pour le pourquoi du filtrage par mot-clé.
     * La casse est ignorée : la collation MySQL du projet est insensible à la casse.
     */
    public function scopeTechniciensMaintenance(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            foreach (self::MOTSCLES_POSTE_MAINTENANCE as $motCle) {
                $q->orWhere('poste', 'like', '%'.$motCle.'%');
            }
        });
    }

    /**
     * Interventions déclarées par cet employé (Phase 05) — employe_id a été éclaté en
     * declarant_employe_id/technicien_employe_id, cette relation suit le déclarant.
     */
    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class, 'declarant_employe_id');
    }

    public function interventionsRepareesEnTantQueTechnicien(): HasMany
    {
        return $this->hasMany(Intervention::class, 'technicien_employe_id');
    }

    public function depensesValidees(): HasMany
    {
        return $this->hasMany(Depense::class, 'valideur_id');
    }

    public function onboardingTaches(): HasMany
    {
        return $this->hasMany(OnboardingTache::class);
    }

    public function licenciements(): HasMany
    {
        return $this->hasMany(Licenciement::class);
    }

    /**
     * Taches d'entretien (Phase 11) assignees a cet employe.
     */
    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class, 'employe_assigne_id');
    }

    public function competences(): BelongsToMany
    {
        return $this->belongsToMany(Competence::class);
    }

    /**
     * Le contrat en vigueur (sans date_fin, ou date_fin future), le plus récent.
     * Source de vérité pour le salaire affiché (règle 5) — salaire_base n'est plus édité.
     */
    public function contratActif(): ?ContratTravail
    {
        return $this->contratsTravail()
            ->where(fn ($q) => $q->whereNull('date_fin')->orWhereDate('date_fin', '>=', now()))
            ->orderByDesc('date_debut')
            ->first();
    }
}
