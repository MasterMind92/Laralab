<?php

namespace App\Console\Commands;

use App\Models\Intervention;
use App\Notifications\Interne\SlaDepasse;
use App\Support\Destinataires;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

/**
 * Balaie les interventions ouvertes dont le délai de prise en charge est dépassé et
 * prévient le pôle Maintenance (Phase 12).
 *
 * Première commande planifiée du projet. Elle existe parce qu'un dépassement de SLA n'est
 * pas un événement applicatif : aucune action utilisateur ne le produit, c'est le temps
 * qui passe. Sans ordonnanceur, un centre de notifications ne notifierait rien de tout ce
 * qui relève du délai — il ne ferait que compter.
 */
class AlerterSlaDepasse extends Command
{
    protected $signature = 'maintenance:alerter-sla';

    protected $description = 'Notifie le pôle Maintenance des interventions dont le délai de prise en charge est dépassé';

    public function handle(): int
    {
        // withoutGlobalScopes : la commande tourne sans utilisateur connecté, or la portée
        // par entreprise d'Intervention s'appuie sur auth(). Sans ce retrait, le scope ne
        // filtrerait rien du tout (utilisateur null = pas de filtre) — on l'enlève donc
        // explicitement, et on regroupe nous-mêmes par entreprise juste après, pour que
        // chaque locataire ne soit prévenu que de SES pannes.
        $enRetard = Intervention::withoutGlobalScopes()
            ->ouvertes()
            ->horsDelai()
            ->whereNull('sla_notifie_le')
            ->with(['equipement:id,nom', 'appartement:id,numero,entreprise_id'])
            ->get();

        if ($enRetard->isEmpty()) {
            $this->info('Aucun dépassement de SLA à signaler.');

            return self::SUCCESS;
        }

        $envoyees = 0;

        foreach ($enRetard->groupBy(fn (Intervention $i) => $i->appartement?->entreprise_id) as $entrepriseId => $interventions) {
            // groupBy transforme la clé en chaîne : '' pour le monde orphelin.
            $destinataires = Destinataires::pourRole('maintenance', $entrepriseId === '' ? null : (int) $entrepriseId);

            if ($destinataires->isEmpty()) {
                $this->warn(sprintf(
                    '%d intervention(s) hors délai sans destinataire (entreprise %s) — aucun compte maintenance actif.',
                    $interventions->count(),
                    $entrepriseId === '' ? 'orpheline' : $entrepriseId,
                ));

                continue;
            }

            foreach ($interventions as $intervention) {
                Notification::send($destinataires, new SlaDepasse($intervention));

                // Marqué APRÈS l'envoi : si la notification échoue, l'intervention reste
                // candidate au passage suivant plutôt que d'être silencieusement oubliée.
                $intervention->forceFill(['sla_notifie_le' => now()])->save();
                $envoyees++;
            }
        }

        $this->info("{$envoyees} alerte(s) de dépassement envoyée(s).");

        return self::SUCCESS;
    }
}
