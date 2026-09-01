<?php

namespace App\Notifications\Interne;

use App\Models\Candidat;

/**
 * Une candidature vient d'arriver par le portail carrières (Phase 04). Le dépôt est
 * auto-service : personne du côté RH n'est dans la boucle au moment où il se produit.
 */
class CandidatureRecue extends NotificationInterne
{
    public function __construct(private readonly Candidat $candidat) {}

    public function titre(): string
    {
        return 'Nouvelle candidature';
    }

    public function message(): string
    {
        $poste = $this->candidat->recrutement?->poste;

        return trim(sprintf(
            '%s%s',
            trim($this->candidat->nom.' '.$this->candidat->prenom),
            $poste ? " — offre « {$poste} »." : '.',
        ));
    }

    public function pole(): string
    {
        return 'rh';
    }

    /**
     * La fiche du recrutement, et non la liste : c'est la page qui porte le pipeline
     * (Kanban 5 étapes) où la candidature doit être traitée. Seule des quatre
     * notifications de ce lot à pouvoir viser l'enregistrement lui-même — les trois
     * autres écrans n'ont pas encore de filtre serveur.
     */
    public function url(): string
    {
        return '/admin/recrutements/'.$this->candidat->recrutement_id;
    }
}
