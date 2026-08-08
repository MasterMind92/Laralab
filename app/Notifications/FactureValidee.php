<?php

namespace App\Notifications;

use App\Models\Facture;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FactureValidee extends Notification
{
    public function __construct(private readonly Facture $facture)
    {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $sejour = $this->facture->sejour;
        $appartement = $sejour->reservation->appartement;
        $client = $sejour->reservation->client;
        $titre = $appartement->titre ?? $appartement->numero;

        return (new MailMessage)
            ->subject('Votre facture '.$this->facture->numero_facture.' — LuxStay')
            ->greeting('Bonjour '.$client->prenom.',')
            ->line("Votre facture pour le séjour à {$titre} est disponible.")
            ->line('Montant total TTC : '.number_format((float) $this->facture->montant_ttc, 0, ',', ' ').' FCFA.')
            ->action('Voir mes réservations', route('client.reservations.index'))
            ->line('Notre équipe reste à votre disposition pour toute question.')
            ->theme('luxstay');
    }
}
