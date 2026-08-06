<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReservationAnnulee extends Notification
{
    public function __construct(private readonly Reservation $reservation)
    {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $appartement = $this->reservation->appartement;
        $client = $this->reservation->client;
        $titre = $appartement->titre ?? $appartement->numero;
        $debut = $this->reservation->date_debut->format('d/m/Y');
        $fin = $this->reservation->date_fin->format('d/m/Y');

        return (new MailMessage)
            ->subject('Votre réservation a été annulée — LuxStay')
            ->greeting('Bonjour '.$client->prenom.',')
            ->line("Votre réservation pour {$titre} du {$debut} au {$fin} a été annulée.")
            ->line("Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter.")
            ->action('Voir nos appartements', url('/appartements'))
            ->theme('luxstay');
    }
}
