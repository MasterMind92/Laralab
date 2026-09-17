<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Une ligne du journal d'audit (extension Phase 08) — jamais créée directement, toujours
 * via consigner(), appelée par le trait Auditable sur les modèles qui l'utilisent. Table en
 * AJOUT SEUL : pas de méthode update, pas d'updated_at (voir la migration).
 */
#[Fillable(['entreprise_id', 'user_id', 'auditable_type', 'auditable_id', 'action', 'donnees'])]
class JournalAudit extends Model
{
    use BelongsToEntreprise;

    public const UPDATED_AT = null;

    public const ACTIONS = ['creation', 'modification', 'suppression', 'restauration'];

    protected function casts(): array
    {
        return [
            'donnees' => 'array',
        ];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Écrit une ligne pour $action sur $modele — jamais en console (artisan, tinker,
     * seeders, tests) : le journal trace de vraies actions, pas du seeding. Voir
     * app/Models/Concerns/Auditable.php pour l'appelant.
     */
    public static function consigner(Model $modele, string $action): void
    {
        if (app()->runningInConsole()) {
            return;
        }

        $exclusions = method_exists($modele, 'auditExclusions') ? $modele->auditExclusions() : ['updated_at'];

        $donnees = match ($action) {
            'creation', 'suppression', 'restauration' => collect($modele->getAttributes())->except($exclusions)->all(),
            'modification' => collect($modele->getChanges())->except($exclusions)
                ->mapWithKeys(fn ($apres, $champ) => [$champ => ['avant' => $modele->getOriginal($champ), 'apres' => $apres]])
                ->all(),
            default => [],
        };

        if ($action === 'modification' && $donnees === []) {
            // Rien de significatif n'a changé (ex. un saveQuietly() ailleurs, ou seul un
            // champ exclu comme updated_at) — une ligne vide n'apprendrait rien à personne.
            return;
        }

        static::create([
            // Priorité à l'entreprise du modèle audité (colonne directe si le modèle en a
            // une) ; à défaut, celle de l'utilisateur courant — seul cas non couvert : un
            // administrateur (exempté de scope) éditant un modèle sans entreprise_id direct.
            'entreprise_id' => $modele->getAttribute('entreprise_id') ?? auth()->user()?->entreprise_id,
            'user_id' => auth()->id(),
            'auditable_type' => $modele->getMorphClass(),
            'auditable_id' => $modele->getKey(),
            'action' => $action,
            'donnees' => $donnees,
        ]);
    }
}
