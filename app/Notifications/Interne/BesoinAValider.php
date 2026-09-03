<?php

namespace App\Notifications\Interne;

use App\Models\Besoin;

/**
 * Un besoin vient d'être soumis et attend un arbitrage (Phase 10).
 *
 * Émise à la SOUMISSION et non à la création : un brouillon n'engage personne, son auteur
 * le retouche autant qu'il veut. Notifier dès la création ferait sonner la cloche pour du
 * travail qui n'est pas encore demandé.
 */
class BesoinAValider extends NotificationInterne
{
    public function __construct(private readonly Besoin $besoin) {}

    public function titre(): string
    {
        return 'Besoin à valider';
    }

    public function message(): string
    {
        $demandeur = $this->besoin->demandeur;
        $nom = $demandeur ? trim($demandeur->prenom.' '.$demandeur->nom) : null;
        $destination = $this->besoin->appartement?->numero;

        return trim(sprintf(
            '%s × %d%s%s — priorité %s.',
            $this->besoin->designation,
            $this->besoin->quantite,
            $nom ? ", demandé par {$nom}" : '',
            $destination ? " pour l'appartement {$destination}" : '',
            $this->besoin->priorite,
        ));
    }

    public function pole(): string
    {
        return 'logistique';
    }

    public function niveau(): string
    {
        // Un besoin en priorité haute est le seul qui mérite de sortir du lot : les autres
        // se traitent dans le flux normal de l'écran.
        return $this->besoin->priorite === 'haute' ? 'alerte' : 'info';
    }

    /**
     * La file des besoins soumis, et non ce besoin précis : l'arbitrage se fait par lot —
     * on ouvre l'écran pour trancher tout ce qui attend, pas une ligne à la fois.
     */
    public function url(): string
    {
        return '/admin/logistique/besoins?statut=soumis';
    }
}
