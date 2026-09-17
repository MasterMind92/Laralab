# Mise en production — checklist

Ce document couvre uniquement ce qui est **indépendant de l'hébergeur** (pas encore choisi
au 2026-09-17). Les sections provisioning serveur / CI-CD / sauvegardes / monitoring
dépendent de ce choix et restent à écrire une fois tranché.

## Avant le tout premier déploiement

- Générer `APP_KEY` une seule fois (`php artisan key:generate`) et le conserver stable
  ensuite. Le régénérer casse les sessions et tout ce qui est chiffré (cookies, colonnes
  `encrypted`).
- `php artisan storage:link` (lien symbolique `public/storage`, requis pour servir les
  fichiers uploadés).
- Copier `.env.example`, renseigner les vraies valeurs (voir le bloc "production" en bas du
  fichier) : `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` réel en HTTPS, base de
  données MySQL réelle, `SESSION_SECURE_COOKIE=true`, `MAIL_MAILER` réel (pas `log`).

## À chaque déploiement

```
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

Si `.env` a changé depuis le déploiement précédent, faire `php artisan config:clear` avant
`config:cache` (sinon l'ancien cache reste actif).

## Cron requis

```
* * * * * php artisan schedule:run
```

Un seul ordonnanceur existe aujourd'hui (Phase 12) : `maintenance:alerter-sla`, toutes les
15 minutes — voir `bootstrap/app.php`. Sans cette ligne de cron, les alertes de dépassement
de SLA ne partent jamais en production.

## Worker de file d'attente

**Aucun requis actuellement.** Toutes les notifications (transactionnelles et internes)
sont envoyées de façon synchrone — aucune classe n'implémente `ShouldQueue`. À revoir si ça
change.

## Dépendance système : Chrome/Chromium

La génération PDF des devis/factures (Phase 03) passe par Browsershot. Renseigner
`BROWSERSHOT_CHROME_PATH` dans `.env` si un Chrome/Chromium est installé sur le serveur,
sinon laisser vide (Browsershot utilise alors son propre Chromium via npm).

## Stockage des fichiers uploadés

CVs de candidats, contrats de travail, photos de logement sont stockés sur le disque
(`FILESYSTEM_DISK`). Ce répertoire **doit survivre aux déploiements** — jamais recréé vide
par le pipeline de déploiement. Le choix définitif (disque persistant du serveur vs S3) est
à trancher avec l'hébergement.

## Hors scope pour l'instant (dépend de l'hébergeur, pas encore choisi)

- Provisioning serveur (nginx/Apache, PHP-FPM, MySQL, certificat SSL).
- Pipeline de déploiement automatisé (CI existe déjà pour les tests/le lint —
  `.github/workflows/`, mais rien ne déploie).
- Sauvegardes base de données.
- Monitoring/alerting externe.
