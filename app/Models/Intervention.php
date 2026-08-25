<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * cout_total et sous_garantie sont volontairement ABSENTS de Fillable : le premier ne
 * doit jamais être écrit autrement que par recalculerCout() (somme dérivée de
 * intervention_actions.cout), le second est figé une seule fois à la déclaration
 * (Equipement::estSousGarantie() au moment du signalement, R7) et ne doit plus jamais
 * bouger ensuite — même via une future route d'édition qui passerait un tableau
 * validé directement à update()/create(). À renseigner uniquement par assignation
 * directe ou forceFill() depuis du code serveur de confiance.
 */
#[Fillable([
    'equipement_id', 'appartement_id', 'declarant_employe_id', 'technicien_employe_id',
    'description_panne', 'priorite', 'date_signalement', 'date_planifiee', 'date_prise_en_charge',
    'sla_echeance', 'date_resolution', 'etape', 'conformite_resultat', 'conformite_testee_le',
    'conformite_employe_id', 'motif_reforme', 'cout_reparation_estime',
])]
class Intervention extends Model
{
    use SoftDeletes;
    use ScopedThroughEntreprise;

    /**
     * Source de vérité unique du workflow (Phase 05, R9) — statutMacro() en dérive une
     * vue simplifiée, jamais l'inverse. L'ordre reflète le déroulement normal, mais
     * TRANSITIONS reste la référence pour ce qui est réellement autorisé (ex. un test
     * de conformité non_conforme renvoie controlee -> en_cours).
     */
    public const ETAPES = [
        'signalee', 'planifiee', 'technicien_affecte', 'en_cours', 'reparee', 'controlee', 'cloturee', 'reformee',
    ];

    public const TRANSITIONS = [
        'signalee' => ['planifiee', 'technicien_affecte', 'en_cours'],
        'planifiee' => ['technicien_affecte', 'en_cours'],
        'technicien_affecte' => ['en_cours'],
        'en_cours' => ['reparee', 'reformee'],
        'reparee' => ['controlee'],
        'controlee' => ['cloturee', 'en_cours'],
        'cloturee' => [],
        'reformee' => [],
    ];

    public static function entrepriseRelationPath(): string
    {
        return 'appartement';
    }

    protected function casts(): array
    {
        return [
            'date_signalement' => 'datetime',
            'date_planifiee' => 'datetime',
            'date_prise_en_charge' => 'datetime',
            'sla_echeance' => 'datetime',
            'date_resolution' => 'datetime',
            'conformite_testee_le' => 'datetime',
            'cout_reparation_estime' => 'decimal:2',
            'sous_garantie' => 'boolean',
            'cout_total' => 'decimal:2',
        ];
    }

    public function equipement(): BelongsTo
    {
        return $this->belongsTo(Equipement::class);
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }

    public function declarant(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'declarant_employe_id');
    }

    public function technicien(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'technicien_employe_id');
    }

    public function conformiteEmploye(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'conformite_employe_id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(InterventionAction::class);
    }

    /**
     * Vue macro dérivée (R9) — jamais stockée, voir la constante ETAPES ci-dessus.
     */
    public function statutMacro(): string
    {
        return match ($this->etape) {
            'signalee', 'planifiee', 'technicien_affecte' => 'declaree',
            'en_cours' => 'en_cours',
            'reparee', 'controlee' => 'reparee',
            'cloturee' => 'restituee',
            'reformee' => 'reformee',
            // Défensif : une valeur hors des 8 attendues (donnée corrompue, sql_mode
            // non strict) ne doit jamais faire planter un simple affichage dérivé.
            default => 'declaree',
        };
    }

    /**
     * Le SLA mesure le délai de réaction (date_signalement -> date_prise_en_charge),
     * pas le temps de réparation. Une fois la prise en charge actée, le verdict est
     * définitif. Tant que ce n'est pas le cas ET que l'intervention est encore active,
     * la comparaison se fait contre "maintenant" (compte à rebours en direct) — une
     * intervention déjà clôturée/réformée sans date_prise_en_charge enregistrée ne doit
     * jamais être comparée à "maintenant" : le verdict grandirait indéfiniment avec le
     * temps réel alors que le dossier est fermé depuis longtemps.
     */
    public function slaDepasse(): bool
    {
        if (! $this->sla_echeance) {
            return false;
        }

        if ($this->date_prise_en_charge) {
            return $this->date_prise_en_charge->gt($this->sla_echeance);
        }

        if (in_array($this->etape, ['cloturee', 'reformee'], true)) {
            return false;
        }

        return now()->gt($this->sla_echeance);
    }

    public function recalculerCout(): void
    {
        $this->forceFill(['cout_total' => $this->actions()->sum('cout')])->save();
    }
}
