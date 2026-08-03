<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Photos par défaut
    |--------------------------------------------------------------------------
    |
    | Utilisées quand un appartement n'a aucune photo uploadée.
    |
    */

    'photos_defaut' => [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80',
    ],

    /*
    |--------------------------------------------------------------------------
    | Durée d'indisponibilité par défaut
    |--------------------------------------------------------------------------
    |
    | Estimation indicative affichée au client quand un appartement quitte le
    | statut d'entretien "propre". N'ouvre jamais la réservation automatiquement.
    |
    */

    'duree_indisponibilite_defaut_heures' => 24,

];
