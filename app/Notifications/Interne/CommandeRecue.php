<?php

namespace App\Notifications\Interne;

use App\Models\Commande;

/**
 * Une commande vient d'être soldée : tout ce qui avait été commandé est arrivé (Phase 10).
 *
 * Émise sur le passage à `recue` UNIQUEMENT, jamais sur `partiellement_recue` : une
 * livraison partielle est un événement ordinaire dans la vie d'une commande, souvent
 * répété, et notifier chacune ferait de la cloche un journal de quai.
 *
 * L'intérêt de cette notification n'est pas d'annoncer la livraison — le logisticien la
 * saisit lui-même — mais de rappeler que le travail continue ailleurs : les pièces sont là
 * et rien n'est encore entré au parc.
 */
class CommandeRecue extends NotificationInterne
{
    public function __construct(private readonly Commande $commande) {}

    public function titre(): string
    {
        return 'Commande entièrement reçue';
    }

    public function message(): string
    {
        $fournisseur = $this->commande->fournisseur?->nom ?? 'fournisseur inconnu';
        $pieces = (int) $this->commande->lignes->sum('quantite');

        return sprintf(
            '%s — %s, %d article%s à enregistrer au parc.',
            $this->commande->reference ?? 'Commande',
            $fournisseur,
            $pieces,
            $pieces > 1 ? 's' : '',
        );
    }

    public function pole(): string
    {
        return 'logistique';
    }

    /** L'écran suivant dans la chaîne, celui où il reste quelque chose à faire. */
    public function url(): string
    {
        return '/admin/logistique/enregistrement';
    }
}
