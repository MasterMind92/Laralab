# Image de production Laralab -- calquee sur l'environnement de developpement (Laragon) :
#   PHP 8.4 (local : 8.4.6), Node 24 (local : 24.13), memes extensions PHP que `php -m` en
#   local (bcmath calendar exif gd intl xsl zip pdo_mysql pdo_pgsql...).
# Seule difference assumee : Postgres au lieu de MySQL 5.7 (Render n'a pas de MySQL gere).
#
# Base serversideup/php (nginx + php-fpm, maintenue, pensee pour Laravel) en remplacement de
# richarvey/nginx-php-fpm:3.1.6, figee sur PHP 8.2 -- incompatible avec Laravel 13 (PHP >= 8.3).
#
# NON construite sur ce poste (Docker Desktop indisponible) : la premiere verification
# reelle sera le build Render.

ARG PHP_VERSION=8.4
ARG NODE_VERSION=24

# --------------------------------------------------------------------------------------
# Node : binaires recuperes de l'image officielle pour avoir exactement la meme version
# majeure qu'en local (le nodejs des depots Alpine est en retard).
# --------------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS node

# --------------------------------------------------------------------------------------
# Base commune : PHP + extensions + Node
# --------------------------------------------------------------------------------------
FROM serversideup/php:${PHP_VERSION}-fpm-nginx-alpine AS base

USER root

# Extensions absentes de l'image serversideup mais presentes en local
# (pdo_pgsql, pdo_mysql, zip, opcache, pcntl y sont deja).
RUN install-php-extensions bcmath calendar exif gd intl xsl

# libstdc++ : requis par le binaire node (compile pour musl, lie dynamiquement).
RUN apk add --no-cache libstdc++
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

WORKDIR /var/www/html

# --------------------------------------------------------------------------------------
# Build : dependances Composer + assets Vite
# --------------------------------------------------------------------------------------
FROM base AS build

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction --prefer-dist

# PUPPETEER_SKIP_DOWNLOAD : on utilise le chromium systeme de l'image finale.
COPY package.json package-lock.json ./
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci

COPY . .
RUN composer dump-autoload --optimize --no-dev

# Cle et .env ephemeres, valables uniquement pour ce stage : le plugin Vite Wayfinder
# shelle vers `php artisan` pendant `npm run build` pour generer resources/js/actions|routes
# (gitignores). Aucun rapport avec la vraie APP_KEY, fournie a l'execution par Render.
RUN cp .env.example .env && php artisan key:generate --no-interaction \
 && npm run build \
 && rm .env

# --------------------------------------------------------------------------------------
# Image finale
# --------------------------------------------------------------------------------------
FROM base

# chromium + polices : generation PDF devis/factures (Browsershot, Phase 03), qui shelle
# vers `node` + `puppeteer` a l'execution.
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont font-noto

COPY --chown=www-data:www-data . .
COPY --chown=www-data:www-data --from=build /var/www/html/vendor ./vendor
COPY --chown=www-data:www-data --from=build /var/www/html/node_modules ./node_modules
COPY --chown=www-data:www-data --from=build /var/www/html/public/build ./public/build

# Migrations, comptes statiques, caches, ordonnanceur -- a chaque demarrage (Render gratuit :
# ni preDeployCommand, ni shell, ni background worker).
COPY --chmod=755 docker/60-laralab-deploiement.sh /etc/entrypoint.d/60-laralab-deploiement.sh

ENV APP_ENV=production \
    LOG_CHANNEL=stderr \
    PHP_OPCACHE_ENABLE=1 \
    BROWSERSHOT_CHROME_PATH=/usr/bin/chromium

USER www-data

# serversideup ecoute sur 8080 (utilisateur non root) ; PORT=8080 est declare dans render.yaml.
EXPOSE 8080
