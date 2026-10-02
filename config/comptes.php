<?php

/*
|--------------------------------------------------------------------------
| Comptes statiques de l'administration
|--------------------------------------------------------------------------
|
| Un compte par profil interne, provisionné par `php artisan comptes:provisionner`
| (lancé automatiquement au démarrage du conteneur, voir docker/60-laralab-deploiement.sh).
| Existe parce qu'un hébergeur gratuit n'offre ni shell ni commande de pré-déploiement :
| sans cela, aucun moyen de créer le premier compte administrateur en production.
|
| La commande est idempotente : nom, rôle, entreprise et statut actif sont resynchronisés
| à chaque démarrage (cette liste fait foi) ; le mot de passe n'est posé qu'à la création,
| pour qu'un changement fait depuis l'application ne soit pas écrasé au redémarrage
| suivant — sauf si COMPTES_FORCER_MOT_DE_PASSE=true.
|
| Le rôle `client` est volontairement absent : les clients s'inscrivent via le portail.
|
*/

$domaine = env('COMPTES_DOMAINE', 'laralab.test');

return [

    'mot_de_passe' => env('COMPTES_MOT_DE_PASSE'),

    'forcer_mot_de_passe' => (bool) env('COMPTES_FORCER_MOT_DE_PASSE', false),

    // Entreprise à laquelle sont rattachés les profils non exemptés de tenant (tous sauf
    // administrateur, cf. User::TENANT_EXEMPT_ROLES) — créée si absente, retrouvée par nom.
    'entreprise' => [
        'nom' => env('COMPTES_ENTREPRISE', 'Entreprise principale'),
        'email_contact' => env('COMPTES_ENTREPRISE_EMAIL', "contact@{$domaine}"),
    ],

    'profils' => [
        'administrateur' => ['name' => 'Administrateur', 'email' => env('COMPTE_ADMINISTRATEUR_EMAIL', "administrateur@{$domaine}")],
        'proprietaire' => ['name' => 'Propriétaire', 'email' => env('COMPTE_PROPRIETAIRE_EMAIL', "proprietaire@{$domaine}")],
        'gerant' => ['name' => 'Gérant', 'email' => env('COMPTE_GERANT_EMAIL', "gerant@{$domaine}")],
        'rh' => ['name' => 'Ressources humaines', 'email' => env('COMPTE_RH_EMAIL', "rh@{$domaine}")],
        'compta' => ['name' => 'Comptabilité', 'email' => env('COMPTE_COMPTA_EMAIL', "compta@{$domaine}")],
        'logistique' => ['name' => 'Logistique', 'email' => env('COMPTE_LOGISTIQUE_EMAIL', "logistique@{$domaine}")],
        'maintenance' => ['name' => 'Maintenance', 'email' => env('COMPTE_MAINTENANCE_EMAIL', "maintenance@{$domaine}")],
        'receptionniste' => ['name' => 'Réceptionniste', 'email' => env('COMPTE_RECEPTIONNISTE_EMAIL', "receptionniste@{$domaine}")],
    ],

];
