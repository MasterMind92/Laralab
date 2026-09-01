<?php

namespace App\Notifications\Interne;

use App\Models\Conge;

/**
 * Une demande de congé attend l'arbitrage RH (règle 6 : planifié avant d'être validé).
 * Le demandeur ne peut rien faire avancer lui-même, la demande dort jusqu'à ce que
 * quelqu'un ouvre l'écran des congés — exactement le trou que la cloche comble.
 */
class CongeAValider extends NotificationInterne
{
    public function __construct(private readonly Conge $conge) {}

    public function titre(): string
    {
        return 'Demande de congé à valider';
    }

    public function message(): string
    {
        $employe = $this->conge->employe;
        $nom = $employe ? trim($employe->nom.' '.$employe->prenom) : 'Employé inconnu';
        $jours = (int) $this->conge->date_debut->diffInDays($this->conge->date_fin) + 1;

        return sprintf(
            '%s — du %s au %s (%d jour%s).',
            $nom,
            $this->conge->date_debut->format('d/m'),
            $this->conge->date_fin->format('d/m'),
            $jours,
            $jours > 1 ? 's' : '',
        );
    }

    public function pole(): string
    {
        return 'rh';
    }

    public function url(): string
    {
        return '/admin/conges';
    }
}
