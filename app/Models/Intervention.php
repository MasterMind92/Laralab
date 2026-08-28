<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
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
    use ScopedThroughEntreprise;
    use SoftDeletes;

    /**
     * Source de vérité unique du workflow (Phase 05, R9) — statutMacro() en dérive une
     * vue simplifiée, jamais l'inverse. L'ordre reflète le déroulement normal, mais
     * TRANSITIONS reste la référence pour ce qui est réellement autorisé (ex. un test
     * de conformité non_conforme renvoie controlee -> en_cours).
     */
    public const ETAPES = [
        'signalee', 'planifiee', 'technicien_affecte', 'en_cours', 'reparee', 'controlee', 'cloturee', 'reformee',
    ];

    /**
     * Les deux issues terminales (R9) : plus aucune transition possible, et le SLA de
     * prise en charge n'a plus de sens (voir slaDepasse()).
     */
    public const ETAPES_TERMINALES = ['cloturee', 'reformee'];

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

        if (in_array($this->etape, self::ETAPES_TERMINALES, true)) {
            return false;
        }

        return now()->gt($this->sla_echeance);
    }

    /**
     * Version SQL de slaDepasse(), pour les compteurs et les filtres de liste : la même
     * règle ne peut pas s'exprimer en PHP sur une collection déjà chargée quand on veut
     * la compter en base. Les deux doivent rester alignées — toute modification de l'une
     * se répercute sur l'autre.
     *
     * Nommé horsDelai et non slaDepasse : un scope homonyme d'une méthode d'instance
     * rendrait Intervention::slaDepasse() impossible en appel statique (PHP trouve la
     * méthode non statique avant d'atteindre __callStatic, et lève une Error).
     */
    public function scopeHorsDelai(Builder $query): Builder
    {
        return $query->whereNotNull('sla_echeance')->where(function (Builder $q) {
            $q->whereColumn('date_prise_en_charge', '>', 'sla_echeance')
                ->orWhere(fn (Builder $sousRequete) => $sousRequete
                    ->whereNull('date_prise_en_charge')
                    ->whereNotIn('etape', self::ETAPES_TERMINALES)
                    ->where('sla_echeance', '<', now()));
        });
    }

    public function scopeOuvertes(Builder $query): Builder
    {
        return $query->whereNotIn('etape', self::ETAPES_TERMINALES);
    }

    /**
     * Garde unique du workflow : aucune route ne doit écrire `etape` sans passer par ici
     * (voir MaintenanceController::changerEtape()).
     */
    public function peutPasserA(string $etape): bool
    {
        return in_array($etape, self::TRANSITIONS[$this->etape] ?? [], true);
    }

    /**
     * Étapes qu'on ne rejoint JAMAIS par la transition générique parce qu'elles exigent
     * une saisie qui leur est propre (R5, R6) : 'controlee' passe par le test de
     * conformité, 'reformee' par la décision de réforme motivée. Les laisser accessibles
     * au bouton générique permettrait d'atteindre 'controlee' sans avoir testé quoi que
     * ce soit, puis de buter sur le verrou de clôture sans comprendre pourquoi.
     */
    public const ETAPES_A_SAISIE_DEDIEE = ['controlee', 'reformee'];

    /**
     * R5 — le test de conformité conditionne la clôture. Une intervention peut être
     * réparée et contrôlée sans être conforme : c'est précisément ce que le contrôle
     * sert à dire, et dans ce cas elle repart en réparation au lieu d'être clôturée.
     */
    public function estConforme(): bool
    {
        return $this->conformite_resultat === 'conforme';
    }

    /**
     * Motif du refus de clôture, ou null si la clôture est possible. Renvoyer la RAISON
     * plutôt qu'un booléen permet à l'API comme à l'écran de dire la même chose à
     * l'utilisateur, sans réécrire la règle des deux côtés.
     */
    public function blocageCloture(): ?string
    {
        if ($this->etape !== 'controlee') {
            return "Seule une intervention contrôlée peut être clôturée (celle-ci est à l'étape « {$this->etape} »).";
        }

        if (! $this->estConforme()) {
            return $this->conformite_resultat === null
                ? "Le test de conformité (R5) n'a pas encore été enregistré."
                : "Le dernier test de conformité est non conforme : l'intervention doit repasser en réparation.";
        }

        return null;
    }

    public function recalculerCout(): void
    {
        $this->forceFill(['cout_total' => $this->actions()->sum('cout')])->save();
    }
}
