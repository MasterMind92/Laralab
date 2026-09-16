<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Appartement;
use App\Models\Equipement;
use App\Models\Intervention;
use App\Models\ParametreMaintenance;
use App\Notifications\Interne\PanneCritiqueSignalee;
use App\Support\Destinataires;
use App\Support\HeuresOuvrees;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InterventionController extends Controller
{
    use ExportsCsv;

    /**
     * Liste les équipements affectés à un appartement (le catalogue, appartement_id
     * null, ne concerne pas le réceptionniste) avec leur historique d'interventions.
     * Filtrable par appartement, statut de l'équipement, et plage de dates de
     * signalement (sur les interventions rattachées).
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'appartement_id' => ['nullable', 'integer'],
            'statut' => ['nullable', 'in:stock,affecte,en_panne,reforme'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
        ]);

        // whereHas('appartement') est le garde-fou manuel qui manquait ici (Phase 08,
        // 2026-09-16) : sans lui, cette liste montrait le parc equipement de TOUTES les
        // entreprises — Equipement n'a pas de scope automatique, voir son doc-comment.
        // Deja applique correctement dans ParcEquipementController::index().
        $equipements = Equipement::whereNotNull('appartement_id')
            ->whereHas('appartement')
            ->with(['appartement:id,numero', 'interventions' => fn ($query) => $query->orderByDesc('date_signalement')])
            ->when($filters['appartement_id'] ?? null, fn ($q, $id) => $q->where('appartement_id', $id))
            ->when($filters['statut'] ?? null, fn ($q, $statut) => $q->where('statut', $statut))
            ->when(
                ($filters['date_debut'] ?? null) || ($filters['date_fin'] ?? null),
                fn ($q) => $q->whereHas('interventions', function ($iq) use ($filters) {
                    $iq->when($filters['date_debut'] ?? null, fn ($iq2, $d) => $iq2->whereDate('date_signalement', '>=', $d));
                    $iq->when($filters['date_fin'] ?? null, fn ($iq2, $d) => $iq2->whereDate('date_signalement', '<=', $d));
                }),
            )
            ->orderBy('appartement_id')
            ->orderBy('nom')
            ->get(['id', 'nom', 'type', 'statut', 'appartement_id']);

        return Inertia::render('receptionniste/equipements', [
            'equipements' => $equipements,
            'appartements' => Appartement::orderBy('numero')->get(['id', 'numero']),
            'filters' => $filters,
        ]);
    }

    /**
     * Signale une panne sur un équipement : crée l'Intervention et fait passer
     * l'équipement en 'en_panne' (décision actée — la résolution reste hors périmètre
     * du réceptionniste, qui se contente de signaler).
     *
     * C'est ici, et nulle part ailleurs, que sont armés les deux champs que le pôle
     * Maintenance consomme ensuite sans jamais les recalculer :
     *  - sla_echeance (R2), dérivée de la priorité déclarée et des heures ouvrées de
     *    l'entreprise. Figée une fois pour toutes : changer les paramètres SLA ne doit
     *    pas déplacer rétroactivement l'échéance des pannes déjà déclarées.
     *  - sous_garantie (R7), photographie de l'état de garantie de l'équipement à
     *    l'instant du signalement. Hors Fillable, donc écrit par forceFill().
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'equipement_id' => ['required', 'integer'],
            'description_panne' => ['required', 'string'],
            'priorite' => ['required', 'in:basse,normale,haute,critique'],
        ]);

        // whereHas('appartement') est le garde-fou manuel qui manquait ici (Phase 08,
        // 2026-09-16) : sans lui, un equipement_id d'une autre entreprise etait accepte,
        // rattache a une nouvelle Intervention, ET reellement modifie (statut -> en_panne
        // plus bas) — une vraie ecriture cross-tenant, pas seulement une lecture.
        $equipement = Equipement::whereHas('appartement')->findOrFail($data['equipement_id']);

        DB::transaction(function () use ($equipement, $data, $request) {
            // Paramètres de l'entreprise de l'utilisateur connecté : le réceptionniste
            // qui signale et l'appartement concerné appartiennent à la même entreprise
            // (le global scope d'Appartement le garantit sur la liste d'où vient l'appel).
            $parametres = ParametreMaintenance::actuel();
            $signalement = now();

            $intervention = new Intervention([
                'equipement_id' => $equipement->id,
                'appartement_id' => $equipement->appartement_id,
                'declarant_employe_id' => $request->user()->employe?->id,
                'description_panne' => $data['description_panne'],
                'priorite' => $data['priorite'],
                'date_signalement' => $signalement,
                'sla_echeance' => HeuresOuvrees::ajouter(
                    $signalement->copy(),
                    $parametres->heuresPour($data['priorite']),
                    $parametres,
                ),
                'etape' => 'signalee',
            ]);
            $intervention->forceFill(['sous_garantie' => $equipement->estSousGarantie()])->save();

            $equipement->update(['statut' => 'en_panne']);

            // Phase 12 : seule une panne CRITIQUE reveille le pole. Notifier chaque
            // signalement transformerait la cloche en journal, et une cloche qui sonne
            // toujours ne se regarde plus — les pannes ordinaires sont deja dans la file
            // "Prise en charge".
            if ($data['priorite'] === 'critique') {
                Notification::send(
                    Destinataires::pourRole('maintenance', $equipement->appartement?->entreprise_id),
                    new PanneCritiqueSignalee($intervention),
                );
            }
        });

        return back();
    }

    /**
     * Supprime (soft delete) une intervention — corrige une saisie erronée.
     */
    public function destroy(Intervention $intervention): RedirectResponse
    {
        $intervention->delete();

        return back();
    }

    /**
     * Exporte les interventions signalées dans la plage de dates donnée.
     */
    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $interventions = Intervention::with(['equipement:id,nom', 'appartement:id,numero'])
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('date_signalement', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('date_signalement', '<=', $to))
            ->orderByDesc('date_signalement')
            ->get();

        return $this->streamCsv(
            'interventions.csv',
            ['ID', 'Appartement', 'Équipement', 'Description', 'Étape', 'Signalée le'],
            $interventions->map(fn (Intervention $i) => [
                $i->id,
                $i->appartement?->numero,
                $i->equipement?->nom,
                $i->description_panne,
                $i->etape,
                $i->date_signalement->toDateString(),
            ]),
        );
    }
}
