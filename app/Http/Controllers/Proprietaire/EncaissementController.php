<?php

namespace App\Http\Controllers\Proprietaire;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EncaissementController extends Controller
{
    use ExportsCsv;

    public function index(): Response
    {
        return Inertia::render('proprietaire/encaissements', [
            'paiements' => Paiement::with([
                'facture.sejour.reservation.appartement:id,numero,titre',
                'facture.sejour.reservation.client:id,nom,prenom',
            ])->orderByDesc('date_paiement')->get(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $paiements = Paiement::with(['facture.sejour.reservation.appartement:id,numero'])
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('date_paiement', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('date_paiement', '<=', $to))
            ->orderByDesc('date_paiement')
            ->get();

        return $this->streamCsv(
            'encaissements.csv',
            ['ID', 'Appartement', 'Montant', 'Mode', 'Date'],
            $paiements->map(fn (Paiement $p) => [
                $p->id,
                $p->facture?->sejour?->reservation?->appartement?->numero ?? '',
                $p->montant,
                $p->mode_paiement,
                $p->date_paiement->toDateString(),
            ]),
        );
    }
}
