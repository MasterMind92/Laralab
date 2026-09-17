<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\JournalAudit;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Journal d'audit (extension Phase 08) — écrans de consultation seuls. Aucune écriture ici :
 * les lignes sont produites par le trait Auditable (app/Models/Concerns/Auditable.php),
 * jamais depuis un contrôleur.
 */
class JournalAuditController extends Controller
{
    use ExportsCsv;

    /** Vue Direction, scopée à l'entreprise (administrateur exempté de scope, voit tout). */
    public function index(Request $request): Response
    {
        $filtres = $this->filtresValides($request);
        $lignes = $this->requeteJournal($filtres)->limit(500)->get();

        return Inertia::render('admin/journal-audit', [
            'lignes' => $lignes->map(fn (JournalAudit $j) => $this->ligne($j)),
            'entites' => $this->entitesConnues(),
            'utilisateurs' => User::orderBy('name')->get(['id', 'name']),
            'filters' => $filtres,
        ]);
    }

    /** Même logique que index() — méthode dédiée car Wayfinder ne supporte pas deux routes sur une même méthode. */
    public function indexProprietaire(Request $request): Response
    {
        return $this->index($request);
    }

    /** Même délégation que indexProprietaire() : Wayfinder ne supporte pas deux routes sur une même méthode. */
    public function exportProprietaire(Request $request): StreamedResponse
    {
        return $this->export($request);
    }

    public function export(Request $request): StreamedResponse
    {
        $filtres = $request->validate([
            'entite' => ['nullable', 'string'],
            'action' => ['nullable', 'in:'.implode(',', JournalAudit::ACTIONS)],
            'user_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $lignes = $this->requeteJournal([
            'entite' => $filtres['entite'] ?? null,
            'action' => $filtres['action'] ?? null,
            'user_id' => $filtres['user_id'] ?? null,
            'du' => $filtres['from'] ?? null,
            'au' => $filtres['to'] ?? null,
        ])->get();

        return $this->streamCsv(
            'journal-audit.csv',
            ['Date', 'Utilisateur', 'Action', 'Entite', 'Donnees'],
            $lignes->map(fn (JournalAudit $j) => [
                $j->created_at->toDateTimeString(),
                $j->utilisateur?->name ?? 'Système',
                $j->action,
                class_basename($j->auditable_type).' #'.$j->auditable_id,
                json_encode($j->donnees, JSON_UNESCAPED_UNICODE),
            ]),
        );
    }

    /**
     * Historique d'un enregistrement précis — appelé depuis n'importe quelle fiche détail
     * (voir resources/js/components/historique.tsx). Pas de rôle dédié : le scope
     * entreprise de JournalAudit suffit, et si l'utilisateur peut ouvrir la fiche il peut
     * voir son historique.
     */
    public function pourAuditable(string $type, int $id): HttpResponse
    {
        $classe = 'App\\Models\\'.$type;

        if (! class_exists($classe) || ! is_subclass_of($classe, Model::class)) {
            abort(404);
        }

        $lignes = JournalAudit::with('utilisateur:id,name')
            ->where('auditable_type', $classe)
            ->where('auditable_id', $id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (JournalAudit $j) => $this->ligne($j));

        return response()->json(['lignes' => $lignes]);
    }

    /** @param array{entite?: ?string, action?: ?string, user_id?: ?int, du?: ?string, au?: ?string} $filtres */
    private function requeteJournal(array $filtres)
    {
        return JournalAudit::with('utilisateur:id,name')
            ->when($filtres['entite'] ?? null, fn ($q, $type) => $q->where('auditable_type', 'App\\Models\\'.$type))
            ->when($filtres['action'] ?? null, fn ($q, $action) => $q->where('action', $action))
            ->when($filtres['user_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
            ->when($filtres['du'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($filtres['au'] ?? null, fn ($q, $a) => $q->whereDate('created_at', '<=', $a))
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }

    /** @return array<string, mixed> */
    private function filtresValides(Request $request): array
    {
        return $request->validate([
            'entite' => ['nullable', 'string'],
            'action' => ['nullable', 'in:'.implode(',', JournalAudit::ACTIONS)],
            'user_id' => ['nullable', 'integer'],
            'du' => ['nullable', 'date'],
            'au' => ['nullable', 'date'],
        ]);
    }

    /** Les types réellement déjà consignés — évite un menu déroulant de 38 entités inutilisées. */
    private function entitesConnues(): array
    {
        return JournalAudit::query()
            ->select('auditable_type')
            ->distinct()
            ->orderBy('auditable_type')
            ->pluck('auditable_type')
            ->map(fn (string $fqcn) => ['valeur' => class_basename($fqcn), 'libelle' => class_basename($fqcn)])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function ligne(JournalAudit $j): array
    {
        return [
            'id' => $j->id,
            'action' => $j->action,
            'entite' => class_basename($j->auditable_type),
            'auditable_id' => $j->auditable_id,
            'donnees' => $j->donnees,
            'utilisateur' => $j->utilisateur?->name,
            'date' => $j->created_at->toIso8601String(),
        ];
    }
}
