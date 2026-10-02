#!/bin/sh
# Copie dans /etc/entrypoint.d/ (voir Dockerfile) : execute par l'entrypoint serversideup a
# chaque demarrage du conteneur, avant nginx/php-fpm. Remplace ce que Render gratuit ne
# fournit pas : preDeployCommand, shell et background worker.
#
# Pas de `set -e` : selon la version de l'image, ce script peut etre source par
# l'entrypoint -- on sort explicitement en cas d'echec bloquant.

cd /var/www/html

# Bloquant : sans schema a jour, inutile de servir du trafic (Render garde alors
# l'ancien deploiement en ligne, le healthcheck /up n'ayant jamais repondu).
php artisan migrate --force || { echo "Laralab : migrations en echec, arret." >&2; exit 1; }

php artisan comptes:provisionner
php artisan storage:link --force
php artisan optimize

# Ordonnanceur (maintenance:alerter-sla toutes les 15 min) lance a cote du serveur web :
# Render gratuit n'a pas de background worker. Il ne tourne donc que lorsque l'instance
# est eveillee (mise en veille apres 15 min sans trafic).
php artisan schedule:work &
