<?php

namespace App\Notifications\Interne;

use App\Models\Intervention;

/**
 * Une intervention vient de m'être affectée. Seule notification de cette phase adressée à
 * UNE personne et non à un pôle entier : le technicien nommé, s'il a un compte de
 * connexion — tous les employés n'en ont pas, la fiche Employe existe aussi pour la paie
 * et les contrats.
 */
class InterventionAffectee extends NotificationInterne
{
    public function __construct(private readonly Intervention $intervention) {}

    public function titre(): string
    {
        return 'Une intervention vous est affectée';
    }

    public function message(): string
    {
        $equipement = $this->intervention->equipement?->nom ?? 'Équipement supprimé';
        $appartement = $this->intervention->appartement?->numero;
        $planifiee = $this->intervention->date_planifiee?->format('d/m à H:i');

        return trim(sprintf(
            '%s%s, priorité %s.%s',
            $equipement,
            $appartement ? " (appartement {$appartement})" : '',
            $this->intervention->priorite,
            $planifiee ? " Planifiée le {$planifiee}." : '',
        ));
    }

    public function pole(): string
    {
        return 'maintenance';
    }

    public function niveau(): string
    {
        return $this->intervention->priorite === 'critique' ? 'critique' : 'info';
    }

    /**
     * Le suivi, isolé sur CETTE intervention. C'est le seul écran qui montre aussi les
     * dossiers fermés : un lien vers l'atelier deviendrait mort dès la clôture, alors
     * qu'une notification reste dans l'historique longtemps après.
     */
    public function url(): string
    {
        return '/admin/maintenance/interventions?intervention='.$this->intervention->id;
    }
}
