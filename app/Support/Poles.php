<?php

namespace App\Support;

use App\Models\User;

/**
 * Le catalogue des pôles émetteurs de notifications (Phase 12).
 *
 * Un pôle est un SERVICE de l'établissement, pas un rôle de connexion : la Direction
 * couvre `proprietaire` et `gerant`, qui reçoivent la même chose. C'est pourquoi la
 * correspondance rôle → pôle est explicite ci-dessous plutôt que déduite du nom du rôle.
 *
 * Le catalogue sert à ORDONNER et NOMMER, jamais à autoriser : une notification portant un
 * pôle inconnu s'affiche quand même, en fin de liste. Brancher un émetteur ne doit pas
 * exiger de revenir ici — on y passe seulement pour lui offrir un libellé propre.
 */
class Poles
{
    /**
     * Slug (tel que stocké dans `data->pole`) => libellé affiché. L'ordre de ce tableau
     * EST l'ordre des sections à l'écran.
     *
     * @var array<string, string>
     */
    public const CATALOGUE = [
        'maintenance' => 'Maintenance',
        'reception' => 'Réception',
        'comptabilite' => 'Comptabilité',
        'rh' => 'Ressources humaines',
        'logistique' => 'Logistique',
        'direction' => 'Direction',
    ];

    /**
     * Rôle de connexion => pôle d'appartenance. Un rôle absent de ce tableau n'a pas de
     * pôle : c'est le cas de `administrateur` (personnel de l'éditeur, hors exploitation)
     * et de `client` (qui n'a pas accès au back-office).
     *
     * @var array<string, string>
     */
    public const ROLE_VERS_POLE = [
        'maintenance' => 'maintenance',
        'receptionniste' => 'reception',
        'compta' => 'comptabilite',
        'rh' => 'rh',
        'logistique' => 'logistique',
        'proprietaire' => 'direction',
        'gerant' => 'direction',
    ];

    /** Le pôle de l'utilisateur, pour hisser SA section en tête de page. */
    public static function pourUtilisateur(?User $utilisateur): ?string
    {
        return self::ROLE_VERS_POLE[$utilisateur?->role] ?? null;
    }

    public static function libelle(?string $slug): string
    {
        if ($slug === null || $slug === '') {
            return 'Autres';
        }

        // Un pôle hors catalogue reste lisible : « suivi_qualite » devient « Suivi qualite ».
        return self::CATALOGUE[$slug] ?? ucfirst(str_replace('_', ' ', $slug));
    }

    /**
     * Rang de tri d'un pôle. Les inconnus passent après le catalogue, et le groupe « Autres »
     * (pôle absent) ferme la marche : c'est du résidu d'historique, pas une rubrique de
     * travail.
     */
    public static function rang(?string $slug): int
    {
        if ($slug === null || $slug === '') {
            return 999;
        }

        $rang = array_search($slug, array_keys(self::CATALOGUE), true);

        return $rang === false ? 900 : $rang;
    }
}
