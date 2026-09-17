<?php

namespace App\Models\Concerns;

use App\Models\JournalAudit;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Journal d'audit (extension Phase 08) : consigne creation/modification/suppression (et
 * restauration, sur les modeles SoftDeletes) via JournalAudit::consigner(). Meme mecanique
 * que BelongsToEntreprise/ScopedThroughEntreprise (un boot{Trait}() de plus, Eloquent les
 * appelle tous) — premiere fois que ce projet hook created/updated/deleted plutot que
 * creating/saving, necessaire pour ne rien oublier sur ~38 modeles sans les cabler un par
 * un dans chaque controleur.
 */
trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(fn ($modele) => JournalAudit::consigner($modele, 'creation'));
        static::updated(fn ($modele) => JournalAudit::consigner($modele, 'modification'));
        static::deleted(fn ($modele) => JournalAudit::consigner($modele, 'suppression'));

        // restored()/forceDeleted() n'existent que sur les modeles qui utilisent
        // SoftDeletes — les appeler sur un modele qui ne l'utilise pas leve une erreur.
        if (in_array(SoftDeletes::class, class_uses_recursive(static::class), true)) {
            static::restored(fn ($modele) => JournalAudit::consigner($modele, 'restauration'));
        }
    }

    /**
     * Champs jamais consignes (ni en creation/suppression, ni dans un diff de
     * modification) — surchargeable par modele. Voir User::auditExclusions() pour
     * l'exemple qui compte (mot de passe, tokens).
     *
     * @return array<int, string>
     */
    public function auditExclusions(): array
    {
        return ['updated_at'];
    }
}
