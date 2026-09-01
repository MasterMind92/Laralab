<?php

namespace App\Notifications\Interne;

use App\Models\Intervention;

/**
 * R2 — le délai de prise en charge n'a pas été tenu. Émise par la commande planifiée
 * `maintenance:alerter-sla` : un dépassement n'est pas un événement applicatif, c'est du
 * temps qui passe, personne ne « fait » l'action qui le déclenche.
 */
class SlaDepasse extends NotificationInterne
{
    public function __construct(private readonly Intervention $intervention) {}

    public function titre(): string
    {
        return 'Délai de prise en charge dépassé';
    }

    public function message(): string
    {
        $equipement = $this->intervention->equipement?->nom ?? 'Équipement supprimé';
        $appartement = $this->intervention->appartement?->numero;
        $echeance = $this->intervention->sla_echeance?->format('d/m à H:i');

        return trim(sprintf(
            '%s%s — panne en priorité %s, à prendre en charge avant le %s.',
            $equipement,
            $appartement ? " (appartement {$appartement})" : '',
            $this->intervention->priorite,
            $echeance ?? 'échéance inconnue',
        ));
    }

    public function pole(): string
    {
        return 'maintenance';
    }

    public function niveau(): string
    {
        // Une panne critique hors délai n'est pas la même urgence qu'une panne basse
        // oubliée : le niveau suit la priorité déclarée plutôt que d'être figé.
        return in_array($this->intervention->priorite, ['critique', 'haute'], true) ? 'critique' : 'alerte';
    }

    public function url(): string
    {
        return '/admin/maintenance/interventions?sla=depasse';
    }
}
