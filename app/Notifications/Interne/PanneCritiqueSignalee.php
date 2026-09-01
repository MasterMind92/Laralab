<?php

namespace App\Notifications\Interne;

use App\Models\Intervention;

/**
 * Une panne critique vient d'être déclarée par la réception. Contrairement au dépassement
 * de SLA, celle-ci est un vrai événement : elle part au moment du signalement.
 *
 * Seule la priorité `critique` déclenche une notification. Notifier chaque panne
 * transformerait la cloche en journal, et une cloche qui sonne toujours ne se regarde
 * plus — les pannes ordinaires sont déjà visibles dans la file « Prise en charge ».
 */
class PanneCritiqueSignalee extends NotificationInterne
{
    public function __construct(private readonly Intervention $intervention) {}

    public function titre(): string
    {
        return 'Panne critique signalée';
    }

    public function message(): string
    {
        $equipement = $this->intervention->equipement?->nom ?? 'Équipement supprimé';
        $appartement = $this->intervention->appartement?->numero;
        $echeance = $this->intervention->sla_echeance?->format('d/m à H:i');

        return trim(sprintf(
            '%s%s : %s%s',
            $equipement,
            $appartement ? " (appartement {$appartement})" : '',
            $this->intervention->description_panne,
            $echeance ? " — prise en charge attendue avant le {$echeance}." : '.',
        ));
    }

    public function pole(): string
    {
        return 'maintenance';
    }

    public function niveau(): string
    {
        return 'critique';
    }

    /**
     * La file de prise en charge, filtrée sur l'équipement concerné : la notification doit
     * poser l'utilisateur DEVANT la panne, pas devant une liste où la retrouver.
     *
     * L'équipement plutôt que l'intervention, parce que c'est l'unité de travail de cet
     * écran — et parce qu'un équipement qui porte deux pannes doit les montrer toutes les
     * deux au technicien qui s'en approche.
     */
    public function url(): string
    {
        return '/admin/maintenance/pannes?equipement_id='.$this->intervention->equipement_id;
    }
}
