<?php

namespace App\Notifications\Interne;

use Illuminate\Notifications\Notification;

/**
 * Socle des notifications INTERNES (Phase 12) — celles qui alimentent la cloche du
 * back-office, par opposition aux notifications client de `App\Notifications\*`, qui
 * partent par e-mail (Phases 02 et 03). Les deux familles cohabitent sur la même
 * machinerie Laravel ; seul le canal change.
 *
 * Toute notification interne produit la MÊME forme de données, parce que la cloche et la
 * page de liste les affichent sans savoir laquelle elles manipulent : un titre, un
 * message, un lien pour agir, un niveau et un pôle d'origine. Ajouter une notification,
 * c'est remplir ces cinq trous — pas inventer une nouvelle structure.
 */
abstract class NotificationInterne extends Notification
{
    /** Niveaux, du plus calme au plus urgent — pilotent la couleur du badge. */
    public const NIVEAUX = ['info', 'alerte', 'critique'];

    /**
     * Canal `database` uniquement. Doubler par e-mail serait une décision à part
     * entière : le personnel travaille dans l'application, l'inonder d'e-mails
     * transactionnels internes est le meilleur moyen qu'il cesse de les lire.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    abstract public function titre(): string;

    abstract public function message(): string;

    /** Le pôle d'origine, pour regrouper et filtrer côté écran. */
    abstract public function pole(): string;

    /** Où aller pour agir. Une notification sans action utile n'a pas grand intérêt. */
    public function url(): ?string
    {
        return null;
    }

    public function niveau(): string
    {
        return 'info';
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'titre' => $this->titre(),
            'message' => $this->message(),
            'url' => $this->url(),
            'niveau' => $this->niveau(),
            'pole' => $this->pole(),
        ];
    }
}
