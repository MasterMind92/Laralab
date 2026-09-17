<?php

namespace App\Notifications;

use App\Models\ParametreFacturation;
use App\Models\Reservation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReservationConfirmee extends Notification
{
    public function __construct(private readonly Reservation $reservation) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $appartement = $this->reservation->appartement;
        $nights = (int) $this->reservation->date_debut->diffInDays($this->reservation->date_fin);

        ['discount' => $discount, 'sous_total' => $sousTotal] = $appartement->prixPour($nights);

        $parametres = ParametreFacturation::actuel($appartement->entreprise_id);
        $fee = $parametres->frais_service_actif ? round($sousTotal * (float) $parametres->taux_frais_service) : 0;
        $total = $sousTotal + $fee;

        $titre = $appartement->titre ?? $appartement->numero;
        $debut = $this->reservation->date_debut->format('d/m/Y');
        $fin = $this->reservation->date_fin->format('d/m/Y');

        $mail = (new MailMessage)
            ->subject('Votre demande de réservation — LuxStay')
            ->greeting('Bonjour '.$notifiable->client->prenom.',')
            ->line("Nous avons bien reçu votre demande de réservation pour {$titre}.")
            ->line("Du {$debut} au {$fin} ({$nights} nuit".($nights > 1 ? 's' : '').($this->reservation->nombre_personnes ? ", {$this->reservation->nombre_personnes} personne".($this->reservation->nombre_personnes > 1 ? 's' : '') : '').').')
            ->line('Montant estimé : '.number_format($total, 0, ',', ' ').' FCFA'.($discount > 0 ? ' (réduction séjour longue durée incluse)' : ''))
            ->line("Cette estimation sera confirmée par notre équipe — aucun paiement n'est prélevé pour l'instant.")
            ->action("Voir l'appartement", url("/appartements/{$appartement->id}"))
            ->theme('luxstay');

        return $mail;
    }
}
