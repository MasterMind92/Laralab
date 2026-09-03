<?php

namespace App\Notifications\Interne;

use App\Models\Reception;
use App\Models\ReceptionLigne;
use Illuminate\Support\Collection;

/**
 * Une livraison ne correspond pas au bon de commande (Phase 10).
 *
 * Un écart est soit une non-conformité déclarée par le réceptionnaire, soit une quantité
 * qui ne correspond pas à ce qui avait été commandé — **dans un sens comme dans l'autre** :
 * un fournisseur qui livre trop crée autant de travail qu'un fournisseur qui livre peu
 * (surfacturation, retour, stock non budgété). Le verdict vient de
 * `ReceptionLigne::presenteUnEcart()`, jamais rejoué ici.
 *
 * UNE notification par réception et non par ligne : un camion qui arrive avec trois
 * articles douteux est un seul problème à traiter, et trois notifications feraient croire
 * à trois incidents.
 */
class EcartReception extends NotificationInterne
{
    /** @param Collection<int, ReceptionLigne> $ecarts */
    public function __construct(
        private readonly Reception $reception,
        private readonly Collection $ecarts,
    ) {}

    public function titre(): string
    {
        return 'Écart constaté à la réception';
    }

    public function message(): string
    {
        $reference = $this->reception->commande?->reference ?? 'Commande inconnue';

        $details = $this->ecarts
            ->take(3)
            ->map(function (ReceptionLigne $ligne) {
                $designation = $ligne->commandeLigne?->designation ?? 'article inconnu';

                // Les deux seules causes d'écart selon ReceptionLigne::presenteUnEcart() :
                // la non-conformité déclarée, ou le surplus. On nomme celle qui s'applique
                // plutôt que de recalculer le reste dû — une arithmétique dupliquée ici
                // finirait par diverger de celle du modèle.
                $cause = $ligne->conforme
                    ? "{$ligne->quantite_recue} reçu(s), soit plus que ce qui restait dû"
                    : 'non conforme';

                return $ligne->motif_ecart
                    ? "{$designation} ({$cause} — {$ligne->motif_ecart})"
                    : "{$designation} ({$cause})";
            })
            ->implode(' ; ');

        $reste = $this->ecarts->count() - 3;

        return trim(sprintf(
            '%s : %s%s',
            $reference,
            $details,
            $reste > 0 ? " et {$reste} autre".($reste > 1 ? 's' : '').'.' : '.',
        ));
    }

    public function pole(): string
    {
        return 'logistique';
    }

    /**
     * Toujours `alerte` : un écart n'est pas une catastrophe, mais il ne se règle pas tout
     * seul — il faut réclamer, retourner, ou accepter et corriger la commande.
     */
    public function niveau(): string
    {
        return 'alerte';
    }

    public function url(): string
    {
        return '/admin/logistique/receptions';
    }
}
