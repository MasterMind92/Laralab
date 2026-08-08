<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use App\Models\FactureLigne;
use App\Models\ParametreFacturation;
use App\Models\Sejour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FactureController extends Controller
{
    /**
     * Séjours clôturés et leur devis/facture éventuel, pour le pôle Réceptionniste.
     */
    public function index(): Response
    {
        $sejours = Sejour::where('statut', 'cloture')
            ->with([
                'reservation.appartement.equipements',
                'reservation.appartement.reductions',
                'reservation.client:id,nom,prenom',
                'dommages.equipement:id,nom',
                'facture.lignes',
            ])
            ->orderByDesc('date_sortie')
            ->get();

        return Inertia::render('receptionniste/devis', [
            'sejours' => $sejours->map(function (Sejour $sejour) {
                $facture = $sejour->facture;
                $appartement = $sejour->reservation?->appartement;

                return [
                    'id' => $sejour->id,
                    'date_entree' => $sejour->date_entree->toDateString(),
                    'date_sortie' => $sejour->date_sortie?->toDateString(),
                    'appartement' => $appartement ? [
                        'id' => $appartement->id,
                        'numero' => $appartement->numero,
                        'equipements' => $appartement->equipements->map(fn ($e) => ['id' => $e->id, 'nom' => $e->nom])->values(),
                    ] : null,
                    'client' => $sejour->reservation?->client ? [
                        'nom' => $sejour->reservation->client->nom,
                        'prenom' => $sejour->reservation->client->prenom,
                    ] : null,
                    'dommages' => $sejour->dommages->map(fn ($d) => [
                        'id' => $d->id,
                        'description' => $d->description,
                        'montant' => $d->montant,
                        'equipement' => $d->equipement ? ['id' => $d->equipement->id, 'nom' => $d->equipement->nom] : null,
                    ])->values(),
                    'facture' => $facture ? [
                        'id' => $facture->id,
                        'statut' => $facture->statut,
                        'montant_ttc' => $facture->montant_ttc,
                        'devis' => $this->buildDevisData($facture, $sejour),
                    ] : null,
                ];
            }),
        ]);
    }

    /**
     * Aperçu imprimable du devis, en page nue (sans layout admin) affichée dans un
     * nouvel onglet — l'impression navigateur depuis une modale n'est pas fiable
     * (overlay, positionnement), un vrai document plein écran l'est.
     */
    public function imprimer(Sejour $sejour): Response|RedirectResponse
    {
        $facture = $sejour->facture;

        if (! $facture) {
            return back()->withErrors(['sejour' => "Aucun devis n'a encore été généré pour ce séjour."]);
        }

        return Inertia::render('impression/devis', [
            'devis' => $this->buildDevisData($facture, $sejour),
        ]);
    }

    /**
     * Génère (ou régénère, tant que la facture est en brouillon) le devis d'un séjour
     * clôturé : reconstruit les lignes depuis les données réelles (règle de gestion #3
     * du cahier — pas de facture sans état des lieux de sortie, donc séjour clôturé
     * uniquement).
     */
    public function generer(Sejour $sejour): RedirectResponse
    {
        if ($sejour->statut !== 'cloture') {
            return back()->withErrors([
                'sejour' => "Seul un séjour clôturé peut faire l'objet d'un devis.",
            ]);
        }

        $sejour->loadMissing(['reservation.appartement.reductions', 'demandes', 'dommages']);

        $existante = $sejour->facture;
        if ($existante && $existante->statut !== 'brouillon') {
            return back()->withErrors([
                'sejour' => 'Une facture a déjà été validée pour ce séjour.',
            ]);
        }

        $appartement = $sejour->reservation->appartement;
        $parametres = ParametreFacturation::actuel();

        DB::transaction(function () use ($sejour, $existante, $appartement, $parametres) {
            $facture = $existante ?? Facture::create([
                'sejour_id' => $sejour->id,
                'montant_ht' => 0,
                'montant_ttc' => 0,
                'statut' => 'brouillon',
                'date_edition' => now()->toDateString(),
            ]);

            $facture->lignes()->delete();

            $nights = max((int) $sejour->date_entree->diffInDays($sejour->date_sortie ?? $sejour->date_entree), 1);
            ['base' => $base, 'reduction' => $reduction, 'discount' => $discount] = $appartement->prixPour($nights);

            $facture->lignes()->create([
                'type' => 'hebergement',
                'designation' => "Hébergement {$appartement->numero} ({$nights} nuit(s))",
                'quantite' => $nights,
                'prix_unitaire' => $appartement->prix_nuit,
                'montant' => $base,
            ]);

            if ($reduction) {
                $facture->lignes()->create([
                    'type' => 'reduction',
                    'designation' => "Réduction séjour ({$reduction->nuits_min} nuits et +)",
                    'quantite' => 1,
                    'prix_unitaire' => -$discount,
                    'montant' => -$discount,
                ]);
            }

            foreach ($sejour->demandes as $demande) {
                $facture->lignes()->create([
                    'type' => 'service',
                    'designation' => $demande->designation,
                    'quantite' => $demande->quantite,
                    'prix_unitaire' => $demande->prix_unitaire,
                    'montant' => $demande->quantite * (float) $demande->prix_unitaire,
                ]);
            }

            foreach ($sejour->dommages as $dommage) {
                $facture->lignes()->create([
                    'type' => 'dommage',
                    'designation' => $dommage->description,
                    'quantite' => 1,
                    'prix_unitaire' => $dommage->montant ?? 0,
                    'montant' => $dommage->montant ?? 0,
                ]);
            }

            $sousTotal = (float) $facture->lignes()->sum('montant');

            if ($parametres->frais_service_actif) {
                $frais = round($sousTotal * (float) $parametres->taux_frais_service);
                $facture->lignes()->create([
                    'type' => 'frais_service',
                    'designation' => 'Frais de service ('.round((float) $parametres->taux_frais_service * 100).'%)',
                    'quantite' => 1,
                    'prix_unitaire' => $frais,
                    'montant' => $frais,
                ]);
            }

            $montantHt = (float) $facture->lignes()->sum('montant');
            $tva = $parametres->tva_active ? round($montantHt * (float) $parametres->taux_tva) : 0;

            $facture->update([
                'montant_ht' => $montantHt,
                'montant_ttc' => $montantHt + $tva,
                'date_edition' => now()->toDateString(),
            ]);
        });

        return back();
    }

    /**
     * Transforme une Facture (+ ses lignes figées) en payload attendu par le composant
     * de rendu partagé resources/js/components/devis/Devis.tsx.
     */
    private function buildDevisData(Facture $facture, Sejour $sejour): array
    {
        $facture->loadMissing('lignes');
        $reservation = $sejour->reservation;
        $appartement = $reservation?->appartement;
        $client = $reservation?->client;
        $parametres = ParametreFacturation::actuel();

        $fmt = fn ($n) => number_format((float) $n, 0, ',', ' ').' FCFA';

        $hebergement = $facture->lignes->whereIn('type', ['hebergement', 'reduction'])
            ->map(fn (FactureLigne $l) => [
                'typeAppartement' => $l->designation,
                'nuitees' => $l->quantite,
                'prixUnitaireHT' => $fmt($l->prix_unitaire),
                'montantHT' => $fmt($l->montant),
            ])->values()->all();

        $services = $facture->lignes->whereIn('type', ['service', 'frais_service'])
            ->map(fn (FactureLigne $l) => [
                'service' => $l->designation,
                'quantite' => $l->quantite,
                'prixUnitaireHT' => $fmt($l->prix_unitaire),
                'montantHT' => $fmt($l->montant),
            ])->values()->all();

        $dommages = $facture->lignes->where('type', 'dommage')
            ->map(fn (FactureLigne $l) => [
                'description' => $l->designation,
                'montantHT' => $fmt($l->montant),
            ])->values()->all();

        return [
            'numeroDevis' => $facture->numero_facture ?? ('BROUILLON-'.str_pad((string) $facture->id, 4, '0', STR_PAD_LEFT)),
            'date' => ($facture->date_edition?->format('d/m/Y')) ?? now()->format('d/m/Y'),
            'validite' => '15 jours',
            'clientNom' => trim(($client->prenom ?? '').' '.($client->nom ?? '')),
            'sejourDates' => $sejour->date_entree->format('d/m/Y').' au '.($sejour->date_sortie?->format('d/m/Y') ?? '—'),
            'sejourLieu' => ($appartement->titre ?? $appartement->numero ?? '').' – '.($appartement->adresse ?? ''),
            'hebergement' => $hebergement,
            'sousTotalHebergementHT' => $fmt($facture->lignes->whereIn('type', ['hebergement', 'reduction'])->sum('montant')),
            'services' => $services,
            'sousTotalServicesHT' => $fmt($facture->lignes->whereIn('type', ['service', 'frais_service'])->sum('montant')),
            'dommages' => $dommages,
            'sousTotalDommagesHT' => $fmt($facture->lignes->where('type', 'dommage')->sum('montant')),
            'depotGarantieHT' => $fmt($parametres->depot_garantie_defaut),
            'delaiRestitutionJours' => $parametres->delai_restitution_jours,
            'totalHT' => $fmt($facture->montant_ht),
            'montantTvaHT' => $parametres->tva_active ? $fmt($facture->montant_ttc - $facture->montant_ht) : null,
            'totalTTC' => $fmt($facture->montant_ttc),
            'conditionVersement' => 'Solde intégral exigible à la clôture du séjour.',
            'conditionAnnulation' => 'Selon les conditions générales de réservation en vigueur.',
            'conditionEtatDesLieux' => 'Réalisés contradictoirement à l\'entrée et à la sortie.',
        ];
    }
}
