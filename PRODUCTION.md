# Mise en production — Render

Hébergeur retenu (2026-09-17) : **Render**, plan payant Starter, PostgreSQL managé (Render
ne propose pas de MySQL managé). Déploiement via **Docker** (`Dockerfile` à la racine,
`render.yaml` décrit les 3 services). Ce document couvre ce que l'utilisateur doit faire
lui-même dans le dashboard Render — connecter le compte/repo et les secrets restent hors de
portée d'une session automatisée.

## Ce que `render.yaml` déclare déjà

- **`laralab-web`** (Web Service, Docker) : `healthCheckPath: /up`, `preDeployCommand`
  (migrations + caches + `storage:link --force` à chaque déploiement — voir plus bas
  pourquoi `--force` est nécessaire), un **disque persistant** de 1 Go monté sur
  `storage/app` pour les fichiers uploadés (CVs, contrats, photos de logement).
- **`laralab-scheduler`** (Background Worker, même image) : lance `php artisan
  schedule:work` en continu. **Pas un Render Cron Job** — la doc Render déconseille un cron
  à la minute (facturation à la seconde, timeout 12h, une seule exécution à la fois) et
  recommande un worker continu pour ce cas d'usage. Un seul ordonnanceur existe aujourd'hui
  (`maintenance:alerter-sla`, toutes les 15 min — voir `bootstrap/app.php`) ; sans ce
  worker, les alertes de dépassement de SLA ne partent jamais.
- **`laralab-db`** (PostgreSQL managé) — `DB_URL` est injecté automatiquement dans les deux
  services ci-dessus via `fromDatabase`.

Pas de service Redis, pas de queue worker : aucune notification de ce projet n'implémente
`ShouldQueue` (vérifié explicitement) — tout est synchrone.

## À faire manuellement dans le dashboard Render (une fois, avant le premier déploiement)

- Générer `APP_KEY` en local (`php artisan key:generate --show`) et le coller comme variable
  d'environnement secrète sur **les deux services** (`laralab-web` et `laralab-scheduler`,
  marqués `sync: false` dans `render.yaml`). Ne jamais le régénérer ensuite (casse sessions
  et données chiffrées).
- `APP_URL` : renseigner une fois l'URL réelle connue (sous-domaine `*.onrender.com` fourni
  par Render, ou domaine personnalisé).
- Identifiants SMTP réels (Mailjet d'après l'historique du projet) :
  `MAIL_HOST`/`MAIL_PORT`/`MAIL_USERNAME`/`MAIL_PASSWORD`/`MAIL_FROM_ADDRESS`.
- `BROWSERSHOT_CHROME_PATH` : chemin du binaire chromium installé dans l'image (voir
  section suivante).

## Dépendance système : Chrome/Chromium (Browsershot)

La génération PDF des devis/factures (Phase 03) shelle vers `node`, qui lance Chromium.
Le `Dockerfile` installe `chromium` + `nodejs`/`npm` dans l'image finale (Alpine, via
`apk add`). `puppeteer` a été déplacé de `devDependencies` vers `dependencies` dans
`package.json` (bug latent trouvé au passage : c'est un besoin d'exécution — Browsershot en
a besoin à chaque génération de PDF — pas seulement un outil de dev ; un `npm ci
--omit=dev` l'aurait silencieusement cassé).

**`BROWSERSHOT_CHROME_PATH` non vérifié empiriquement** — Docker Desktop n'a pas pu être
démarré sur ce poste pendant cette session (moteur resté en erreur 500 au démarrage), donc
ni le build de l'image, ni le binaire chromium réel, ni la compatibilité des migrations
avec Postgres n'ont pu être testés en local comme prévu. Deux chemins candidats selon la
version d'Alpine de l'image de base (`richarvey/nginx-php-fpm:3.1.6`) :
`/usr/bin/chromium-browser` (Alpine < 3.19) ou `/usr/bin/chromium` (Alpine ≥ 3.19). **À
confirmer avant le premier déploiement réel**, soit en relançant Docker Desktop sur ce
poste (`docker build . && docker run --rm <image> which chromium chromium-browser`), soit
via l'onglet **Shell** de Render une fois le premier déploiement fait (le service
démarrera même sans la bonne valeur — Browsershot échouera seulement au moment de générer
un PDF, pas au démarrage).

## Non vérifié cette session (Docker Desktop indisponible)

- Le `Dockerfile` construit bel et bien une image (syntaxe/logique relues, mais jamais
  buildées).
- La compatibilité Postgres des migrations réécrites en 2ème passe (`enum()->change()` sans
  doctrine/dbal) — vérifiée jusqu'ici seulement sur MySQL et SQLite, jamais sur Postgres
  réel.
- Le healthcheck `/up` en conteneur.

À faire avant de considérer le déploiement Render fiable : soit relancer Docker Desktop sur
ce poste et rejouer la vérification prévue (build + `postgres:16-alpine` + `migrate:fresh`
+ génération PDF réelle), soit accepter de le découvrir au premier déploiement Render (les
logs de build/deploy Render exposeront toute erreur de migration ou de build).

## Bug de portabilité Postgres corrigé

`MaintenanceController.php` triait par priorité via `FIELD(...)`, une fonction MySQL
absente de Postgres — remplacé par un `CASE WHEN` portable (`TRI_PRIORITE`), identique sur
MySQL/Postgres/SQLite.

## Stockage des fichiers uploadés

CVs, contrats, photos de logement vivent sous `storage/app`, monté sur le disque persistant
Render déclaré dans `render.yaml`. Le lien symbolique `public/storage` (créé par
`storage:link`), lui, n'est **pas** sur ce disque — `public/` fait partie de l'image
reconstruite à chaque déploiement, donc le lien est recréé à chaque fois via
`storage:link --force` dans `preDeployCommand`.

**Compromis accepté** : un disque persistant désactive le zero-downtime deploy côté Render.
Sans conséquence ici (application mono-instance).

## Hors scope pour l'instant

- Nom de domaine personnalisé (le sous-domaine `*.onrender.com` suffit pour démarrer).
- Sauvegardes base de données (Render Postgres a ses propres sauvegardes automatiques selon
  le plan — à vérifier dans le dashboard, pas encore creusé côté application).
- Monitoring/alerting externe.
- CI de déploiement automatisé (la CI existante — `.github/workflows/` — teste/lint, elle ne
  déploie pas ; Render peut déployer automatiquement sur push vers `main` une fois le
  Blueprint connecté, à activer dans le dashboard).
