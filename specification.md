# Spécification — Activité des pôles (tableau de bord transverse)

Document de référence pour l'écran "Activité des pôles" : un résumé de l'activité de chaque pôle métier sur un seul écran, à l'usage de Propriétaire/Gérant (leur propre entreprise) et de l'administrateur (n'importe quelle entreprise cliente, depuis sa fiche entreprise).

Chaque indicateur ci-dessous est repris tel quel d'un tableau de bord de pôle déjà existant — aucune définition n'est réinventée pour cet écran.

## Réception

Repris intégralement de `ReceptionnisteDashboardController`.

| Indicateur | Définition |
|---|---|
| Réservations en attente | `Reservation::where('statut', 'en_attente')->count()` |
| Séjours en cours | `Sejour::where('statut', 'en_cours')->count()` |
| Demandes de service en attente | `DemandeService::where('statut', 'demandee')->count()` |
| Dommages non facturés | `Dommage::whereHas('sejour', fn ($q) => $q->whereDoesntHave('facture'))->count()` |

## Maintenance

Repris intégralement de `MaintenanceController::dashboard()`.

| Indicateur | Définition |
|---|---|
| Pannes à prendre en charge | `Intervention::where('etape', 'signalee')->count()` |
| SLA dépassés | `Intervention::horsDelai()->count()` |
| En réparation | `Intervention::where('etape', 'en_cours')->count()` |
| Total interventions ouvertes | `Intervention::ouvertes()->count()` |

## Comptabilité

4 des 5 indicateurs de `ComptabiliteController::dashboard()` — dépenses du mois volontairement exclue de ce résumé.

| Indicateur | Définition |
|---|---|
| Encaissé ce mois-ci | Somme des `Paiement` du mois en cours |
| Créances clients | `Facture::where('statut', 'validee')->get()->sum(fn ($f) => $f->soldeRestant())` |
| Dettes fournisseur | `FactureFournisseur::aDue()->with('lignes')->get()->sum(fn ($f) => $f->montantTotal())` |
| Achats à valider | `FactureFournisseur::aValider()->count()` |

## RH

2 indicateurs repris de `RhDashboardController` + 1 nouveau.

| Indicateur | Définition |
|---|---|
| Employés actifs | `Employe::where('actif', true)->count()` |
| Recrutements ouverts | `Recrutement::whereIn('statut', ['en_attente_validation', 'validee'])->count()` |
| Tâches à planifier | **Nouveau** — `Tache::where('statut', 'a_faire')->whereHas('reservation', fn ($q) => $q->where('statut', 'validee'))->count()` |

Explicitement exclus de ce résumé (présents dans `RhDashboardController` mais pas ici) : candidats en pipeline, congés en attente.

## Logistique

Repris intégralement de `LogistiqueController::dashboard()`.

| Indicateur | Définition |
|---|---|
| Besoins à valider | `Besoin::where('statut', 'soumis')->count()` |
| Besoins à commander | `Besoin::aCommander()->count()` |
| Commandes ouvertes | `Commande::ouvertes()->count()` |
| Pièces à enregistrer | `(int) ReceptionLigne::aEnregistrer()->sum(DB::raw('quantite_recue - quantite_enregistree'))` |

## Audience & accès

- **Propriétaire / Gérant** — `activite-poles` (`/admin/activite-poles`), scopé automatiquement à leur propre entreprise via les global scopes multi-tenant (`BelongsToEntreprise`/`ScopedThroughEntreprise`). Chaque carte porte un lien "Voir le détail" vers le vrai tableau de bord du pôle.
- **Administrateur** — `admin.entreprises.activite-poles` (`/admin/entreprises/{entreprise}/activite-poles`), accessible depuis la fiche d'une entreprise cliente. L'administrateur étant exempté des global scopes, chaque requête filtre explicitement sur l'entreprise consultée. Pas de lien "Voir le détail" ici (l'administrateur n'a pas les rôles `compta`/`rh`/etc. nécessaires pour ouvrir ces pages).

## Hors périmètre

- Pas de filtre de période — Comptabilité reste sur "le mois en cours", comme son propre tableau de bord.
- Pas de nouvel écran remplaçant `dashboard-proprietaire.tsx` (qui reste inchangé) — celui-ci est un écran additionnel.
- Pas de lien racine dédié côté sidebar admin pour la Réception — seule la fiche entreprise y donne accès côté administrateur.
