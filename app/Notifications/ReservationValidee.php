<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReservationValidee extends Notification
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
            ->subject('Votre réservation est confirmée — LuxStay')
            ->greeting('Bonjour '.$client->prenom.',')
            ->line("Bonne nouvelle : votre réservation pour {$titre} du {$debut} au {$fin} est confirmée.")
            ->line('Notre équipe vous accueillera avec plaisir à votre arrivée.')
            ->action("Voir l'appartement", url("/appartements/{$appartement->id}"))
            ->theme('luxstay');
    }
}
