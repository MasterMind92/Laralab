<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Appartement;
use App\Models\Equipement;
use App\Models\Intervention;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Parc équipements (Phase 05, étape C — R7). Garantie, contrat de maintenance et numéro
 * de série portent sur l'ÉQUIPEMENT, pas sur une panne ponctuelle : ils ont donc leur
 * propre écran plutôt qu'un onglet de plus dans le suivi des interventions.
 *
 * Contrôleur distinct de MaintenanceController, qui pilote le workflow d'intervention.
 * Les deux écrans se répondent — une panne déclarée fige l'état de garantie du moment
 * (Intervention.sous_garantie), c'est ici qu'on tient cet état à jour.
 */
class ParcEquipementController extends Controller
{
    use ExportsCsv;

    /**
     * Equipement n'a délibérément pas de portée automatique par entreprise (la table
     * mélange le catalogue global et les lignes affectées — voir le modèle), d'où le
     * filtre manuel : whereNotNull + whereHas('appartement'), ce dernier bénéficiant
     * bien, lui, de la portée automatique d'Appartement.
     */
    public function index(Request $request): Response
    {
        $filtres = $request->validate([
            'appartement_id' => ['nullable', 'integer', 'exists:appartements,id'],
            'statut' => ['nullable', 'in:stock,affecte,en_panne,reforme'],
            'couverture' => ['nullable', 'in:garantie,contrat,aucune'],
        ]);

        $equipements = Equipement::whereNotNull('appartement_id')
            ->whereHas('appartement')
            ->with(['appartement:id,numero,titre'])
            ->withCount(['interventions'])
            ->when($filtres['appartement_id'] ?? null, fn ($q, $id) => $q->where('appartement_id', $id))
            ->when($filtres['statut'] ?? null, fn ($q, $statut) => $q->where('statut', $statut))
            ->when(($filtres['couverture'] ?? null) === 'garantie', fn ($q) => $q->whereDate('garantie_fin', '>=', now()))
            ->when(($filtres['couverture'] ?? null) === 'contrat', fn ($q) => $q->where('contrat_maintenance', true))
            ->when(
                ($filtres['couverture'] ?? null) === 'aucune',
                fn ($q) => $q->where('contrat_maintenance', false)
                    ->where(fn ($sous) => $sous->whereNull('garantie_fin')->orWhereDate('garantie_fin', '<', now())),
            )
            ->orderBy('appartement_id')
            ->orderBy('nom')
            ->get();

        // Coût cumulé de maintenance par équipement : c'est la donnée qui rend la
        // décision de réforme (R6) défendable — un matériel qui a déjà coûté plus qu'il
        // ne vaut n'a pas à repartir en réparation.
        $couts = Intervention::selectRaw('equipement_id, SUM(cout_total) as total')
            ->whereIn('equipement_id', $equipements->pluck('id'))
            ->groupBy('equipement_id')
            ->pluck('total', 'equipement_id');

        return Inertia::render('maintenance/parc', [
            'equipements' => $equipements->map(fn (Equipement $e) => $this->ligne($e, (float) ($couts[$e->id] ?? 0)))->all(),
            'appartements' => Appartement::orderBy('numero')->get(['id', 'numero']),
            'filters' => $filtres,
        ]);
    }

    /**
     * Met à jour les informations de couverture d'un équipement. Volontairement limité à
     * ces champs-là : le nom, le type et l'affectation d'un équipement relèvent de la
     * fiche Appartement, et l'entrée en parc relèvera de la Phase 10 (Logistique).
     */
    public function update(Request $request, Equipement $equipement): RedirectResponse
    {
        $data = $request->validate([
            'numero_serie' => ['nullable', 'string', 'max:255'],
            'garantie_fin' => ['nullable', 'date'],
            'contrat_maintenance' => ['required', 'boolean'],
            'contrat_reference' => ['nullable', 'string', 'max:255'],
            'contrat_echeance' => ['nullable', 'date'],
        ]);

        // Sans contrat, ses deux champs n'ont plus d'objet : les laisser traîner
        // afficherait une référence de contrat sur un équipement qui n'en a pas.
        if (! $data['contrat_maintenance']) {
            $data['contrat_reference'] = null;
            $data['contrat_echeance'] = null;
        }

        $equipement->update($data);

        return back();
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $equipements = Equipement::whereNotNull('appartement_id')
            ->whereHas('appartement')
            ->with('appartement:id,numero')
            ->withCount('interventions')
            // La plage de dates porte sur la fin de garantie : c'est la seule question
            // de date qu'on se pose sur un parc (« qu'est-ce qui sort de garantie ce
            // trimestre ? »), le reste se filtre à l'écran.
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('garantie_fin', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('garantie_fin', '<=', $to))
            ->orderBy('appartement_id')
            ->orderBy('nom')
            ->get();

        return $this->streamCsv(
            'parc-equipements.csv',
            ['ID', 'Appartement', 'Équipement', 'Type', 'N° de série', 'Statut', 'Fin de garantie', 'Sous garantie', 'Contrat', 'Référence contrat', 'Échéance contrat', 'Interventions', 'Réformé le'],
            $equipements->map(fn (Equipement $e) => [
                $e->id,
                $e->appartement?->numero,
                $e->nom,
                $e->type,
                $e->numero_serie,
                $e->statut,
                $e->garantie_fin?->format('d/m/Y'),
                $e->estSousGarantie() ? 'oui' : 'non',
                $e->aContratMaintenanceActif() ? 'actif' : ($e->contrat_maintenance ? 'expiré' : 'non'),
                $e->contrat_reference,
                $e->contrat_echeance?->format('d/m/Y'),
                $e->interventions_count,
                $e->date_reforme?->format('d/m/Y'),
            ]),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function ligne(Equipement $equipement, float $coutMaintenance): array
    {
        return [
            'id' => $equipement->id,
            'nom' => $equipement->nom,
            'type' => $equipement->type,
            'statut' => $equipement->statut,
            'numero_serie' => $equipement->numero_serie,
            'date_achat' => $equipement->date_achat?->toDateString(),
            'garantie_fin' => $equipement->garantie_fin?->toDateString(),
            // Calculés côté serveur : ces deux règles vivent sur le modèle, l'écran les
            // affiche mais ne les rejoue pas.
            'sous_garantie' => $equipement->estSousGarantie(),
            'contrat_actif' => $equipement->aContratMaintenanceActif(),
            'contrat_maintenance' => (bool) $equipement->contrat_maintenance,
            'contrat_reference' => $equipement->contrat_reference,
            'contrat_echeance' => $equipement->contrat_echeance?->toDateString(),
            'date_reforme' => $equipement->date_reforme?->toDateString(),
            'interventions_count' => $equipement->interventions_count,
            'cout_maintenance' => $coutMaintenance,
            'appartement' => $equipement->appartement
                ? ['id' => $equipement->appartement->id, 'numero' => $equipement->appartement->numero, 'titre' => $equipement->appartement->titre]
                : null,
        ];
    }
}
