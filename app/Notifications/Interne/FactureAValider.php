<?php

namespace App\Notifications\Interne;

use App\Models\Facture;

/**
 * Un devis vient d'être généré par la réception et attend la validation de la
 * Comptabilité (Phase 03 : le devis EST une Facture au statut brouillon).
 *
 * Émise à la CRÉATION seulement, pas à chaque régénération : reconstruire les lignes d'un
 * brouillon existant est une correction de saisie, la file d'attente de la Comptabilité
 * n'en apprend rien de nouveau.
 */
class FactureAValider extends NotificationInterne
{
    public function __construct(private readonly Facture $facture) {}

    public function titre(): string
    {
        return 'Devis à valider';
    }

    public function message(): string
    {
        $reservation = $this->facture->sejour?->reservation;
        $client = $reservation?->client;
        $nom = $client ? trim($client->nom.' '.$client->prenom) : 'Client inconnu';
        $appartement = $reservation?->appartement?->numero;

        return trim(sprintf(
            '%s%s — %s TTC.',
            $nom,
            $appartement ? " · appartement {$appartement}" : '',
            number_format((float) $this->facture->montant_ttc, 0, ',', ' ').' FCFA',
        ));
    }

    public function pole(): string
    {
        return 'comptabilite';
    }

    public function url(): string
    {
        return '/admin/factures';
    }
}
