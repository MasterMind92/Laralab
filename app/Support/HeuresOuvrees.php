<?php

namespace App\Support;

use App\Models\ParametreMaintenance;
use Illuminate\Support\Carbon;

/**
 * Calcule une échéance en "heures ouvrées" : le compteur se met en pause en dehors de
 * la fenêtre heure_ouverture/heure_fermeture et les jours non listés dans jours_ouvres
 * (Phase 05, R2 — le SLA mesure le temps de réaction, pas le temps de réparation).
 * jours_ouvres est un tableau de jours ISO (1=lundi ... 7=dimanche).
 */
class HeuresOuvrees
{
    public static function ajouter(Carbon $depart, float $heures, ParametreMaintenance $parametres): Carbon
    {
        $joursOuvres = $parametres->jours_ouvres ?? [1, 2, 3, 4, 5, 6];
        $ouverture = $parametres->heure_ouverture;
        $fermeture = $parametres->heure_fermeture;

        if (empty($joursOuvres)) {
            throw new \InvalidArgumentException('parametres_maintenance.jours_ouvres ne peut pas être vide (aucun jour ouvré ne permettrait jamais de trouver un instant ouvert).');
        }

        $curseur = self::prochainInstantOuvre($depart->copy(), $joursOuvres, $ouverture, $fermeture);
        $minutesRestantes = (int) round($heures * 60);

        while ($minutesRestantes > 0) {
            $finJournee = $curseur->copy()->setTimeFromTimeString($fermeture);
            $minutesDisponibles = $curseur->diffInMinutes($finJournee, false);

            if ($minutesDisponibles >= $minutesRestantes) {
                return $curseur->addMinutes($minutesRestantes);
            }

            $minutesRestantes -= max($minutesDisponibles, 0);
            $curseur = self::prochainInstantOuvre(
                $curseur->addDay()->setTimeFromTimeString($ouverture),
                $joursOuvres,
                $ouverture,
                $fermeture,
            );
        }

        return $curseur;
    }

    private static function prochainInstantOuvre(Carbon $instant, array $joursOuvres, string $ouverture, string $fermeture): Carbon
    {
        $curseur = $instant->copy();

        while (true) {
            if (in_array($curseur->dayOfWeekIso, $joursOuvres, true)) {
                $debutJournee = $curseur->copy()->setTimeFromTimeString($ouverture);
                $finJournee = $curseur->copy()->setTimeFromTimeString($fermeture);

                if ($curseur->lt($debutJournee)) {
                    return $debutJournee;
                }
                if ($curseur->lt($finJournee)) {
                    return $curseur;
                }
            }

            $curseur = $curseur->addDay()->setTimeFromTimeString($ouverture);
        }
    }
}
