<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Résout « qui doit être prévenu » (Phase 12). Le besoin de Laralab est presque toujours
 * PAR RÔLE — « la Maintenance doit voir ce SLA dépassé » — et non par utilisateur nommé,
 * alors que Laravel notifie des destinataires individuels. Cette classe fait le pont, en
 * un seul endroit, et applique le cloisonnement de la Phase 09.
 */
class Destinataires
{
    /**
     * Les utilisateurs actifs d'un ou plusieurs rôles, dans UNE entreprise.
     *
     * `$entrepriseId` à null ne veut pas dire « toutes les entreprises » mais « le monde
     * orphelin », celui d'avant la Phase 09 : c'est le comportement fail-open déjà acté
     * pour les global scopes, et c'est aussi le cas des comptes de test du projet, tous
     * sans entreprise. Notifier tout le monde quand l'entreprise est inconnue serait une
     * fuite inter-locataires déguisée en commodité.
     *
     * L'administrateur n'est jamais inclus d'office : c'est le personnel de l'éditeur, il
     * n'a pas à recevoir l'exploitation quotidienne de ses clients. À demander
     * explicitement si un jour une alerte plateforme le justifie.
     *
     * @param  array<int, string>|string  $roles
     * @return Collection<int, User>
     */
    public static function pourRole(array|string $roles, ?int $entrepriseId = null): Collection
    {
        return User::query()
            ->whereIn('role', (array) $roles)
            ->where('actif', true)
            ->when(
                $entrepriseId === null,
                fn ($q) => $q->whereNull('entreprise_id'),
                fn ($q) => $q->where('entreprise_id', $entrepriseId),
            )
            ->get();
    }

    /**
     * Le compte de connexion d'un employé, s'il en a un. Tous n'en ont pas : la fiche
     * Employe existe pour la paie et les contrats, le compte n'est créé que pour ceux qui
     * utilisent l'application. Renvoyer une collection (vide ou d'un élément) plutôt
     * qu'un null évite un test de nullité à chaque appel.
     *
     * @return Collection<int, User>
     */
    public static function pourEmploye(?int $employeId): Collection
    {
        if ($employeId === null) {
            return collect();
        }

        return User::query()
            ->where('actif', true)
            ->whereHas('employe', fn ($q) => $q->whereKey($employeId))
            ->get();
    }
}
