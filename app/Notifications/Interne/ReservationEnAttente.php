<?php

namespace App\Notifications\Interne;

use App\Models\Reservation;

/**
 * Une réservation vient d'être déposée depuis le portail client (Phase 02). Elle naît en
 * `en_attente` : rien ne se passe tant que la réception ne l'a pas confirmée, et personne
 * ne surveille cet écran en permanence.
 *
 * Contrairement aux pannes, AUCUN filtre de priorité : une réservation non traitée est un
 * séjour perdu, il n'existe pas de réservation « ordinaire » qu'on pourrait laisser dormir
 * dans une liste.
 */
class ReservationEnAttente extends NotificationInterne
{
    public function __construct(private readonly Reservation $reservation) {}

    public function titre(): string
    {
        return 'Nouvelle réservation à confirmer';
    }

    public function message(): string
    {
        $client = $this->reservation->client;
        $nom = $client ? trim($client->nom.' '.$client->prenom) : 'Client inconnu';
        $appartement = $this->reservation->appartement?->numero;
        $nuits = (int) $this->reservation->date_debut->diffInDays($this->reservation->date_fin);

        return trim(sprintf(
            '%s%s — du %s au %s (%d nuit%s).',
            $nom,
            $appartement ? " · appartement {$appartement}" : '',
            $this->reservation->date_debut->format('d/m'),
            $this->reservation->date_fin->format('d/m'),
            $nuits,
            $nuits > 1 ? 's' : '',
        ));
    }

    public function pole(): string
    {
        return 'reception';
    }

    public function url(): string
    {
        return '/admin/reservations';
    }
}
