<?php

namespace App\Notifications\Interne;

use App\Models\DevisEquipement;

/**
 * Un devis équipement vient d'être généré à l'Enregistrement (extension Phase 06) et
 * attend d'être vu par le Propriétaire/Gérant de l'entreprise concernée.
 *
 * Émise à la CRÉATION seulement, pas à chaque ligne ajoutée au même brouillon — même
 * règle que `FactureAValider`.
 */
class DevisEquipementEmis extends NotificationInterne
{
    public function __construct(private readonly DevisEquipement $devis) {}

    public function titre(): string
    {
        return 'Nouveau devis équipement';
    }

    public function message(): string
    {
        $commande = $this->devis->reception?->commande;
        $fournisseur = $commande?->fournisseur?->nom;

        return trim(sprintf(
            '%s%s — %s FCFA.',
            $commande?->reference ?? 'Réception #'.$this->devis->reception_id,
            $fournisseur ? " · {$fournisseur}" : '',
            number_format($this->devis->montant(), 0, ',', ' '),
        ));
    }

    public function pole(): string
    {
        return 'direction';
    }

    public function url(): string
    {
        return '/admin/mes-devis-equipement';
    }
}
