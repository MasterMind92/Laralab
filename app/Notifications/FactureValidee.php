<?php

namespace App\Notifications;

use App\Models\Facture;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FactureValidee extends Notification
{
    /**
     * @param  string|null  $pdf  Binaire PDF déjà généré (Browsershot) — null si la
     *                            génération a échoué, l'e-mail part alors sans pièce jointe.
     */
    public function __construct(private readonly Facture $facture, private readonly ?string $pdf = null) {}

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

        $mail = (new MailMessage)
            ->subject('Votre facture '.$this->facture->numero_facture.' — LuxStay')
            ->greeting('Bonjour '.$client->prenom.',')
            ->line("Votre facture pour le séjour à {$titre} est disponible.")
            ->line('Montant total TTC : '.number_format((float) $this->facture->montant_ttc, 0, ',', ' ').' FCFA.')
            ->action('Voir mes réservations', route('client.reservations.index'))
            ->line('Notre équipe reste à votre disposition pour toute question.')
            ->theme('luxstay');

        if ($this->pdf !== null) {
            $mail->attachData($this->pdf, 'facture-'.$this->facture->numero_facture.'.pdf', ['mime' => 'application/pdf']);
        }

        return $mail;
    }
}
