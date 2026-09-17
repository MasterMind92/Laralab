# Image de base : richarvey/nginx-php-fpm, celle utilisee par l'exemple officiel Render
# pour Laravel (render-examples/php-laravel-docker) -- nginx+php-fpm+composer deja
# configures pour une racine web Laravel, evite de reconstruire ca a la main.

FROM richarvey/nginx-php-fpm:3.1.6 AS build

RUN apk add --no-cache nodejs npm

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

# Cle et .env ephemeres, valables uniquement pour ce stage : le plugin Vite Wayfinder
# (@laravel/vite-plugin-wayfinder) shelle vers `php artisan` pendant `npm run build`
# pour generer resources/js/actions|routes|wayfinder (fichiers gitignores, jamais commites
# -- voir .gitignore) a partir des routes reelles. Aucun rapport avec la vraie APP_KEY de
# production, qui est fournie a l'execution par Render (voir PRODUCTION.md).
RUN cp .env.example .env && php artisan key:generate --no-interaction

# PUPPETEER_SKIP_DOWNLOAD : on utilise le chromium systeme installe ci-dessous dans l'image
# finale (BROWSERSHOT_CHROME_PATH), pas celui que puppeteer telecharge par defaut.
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci
RUN npm run build

FROM richarvey/nginx-php-fpm:3.1.6

# chromium : requis a l'execution par Browsershot (generation PDF devis/factures, Phase 03)
# nodejs/npm : Browsershot shelle vers `node` a l'execution, qui doit trouver `puppeteer`
# dans node_modules (copie depuis le stage build ci-dessous).
RUN apk add --no-cache nodejs npm chromium

WORKDIR /var/www/html

COPY --from=build /var/www/html/vendor ./vendor
COPY --from=build /var/www/html/node_modules ./node_modules
COPY --from=build /var/www/html/public/build ./public/build
COPY . .

ENV WEBROOT=/var/www/html/public
# composer install deja fait au build ci-dessus, ne pas le refaire a chaque demarrage.
ENV SKIP_COMPOSER=1
ENV APP_ENV=production
ENV PHP_ERRORS_STDERR=1
ENV LOG_CHANNEL=stderr
# Requis derriere le reverse-proxy de Render, meme role que TrustProxies cote Laravel
# (voir bootstrap/app.php).
ENV REAL_IP_HEADER=1

CMD ["/start.sh"]
