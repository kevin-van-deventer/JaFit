# Progressive Workout Coach

A free-to-use mobile-first Progressive Web App for progressive strength training, workout logging, PR tracking, exercise history, body metrics, and rule-based progression.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Build

```bash
npm run build
npm run preview
```

## Cloudflare Demo Deploy

This project is configured for Cloudflare Workers Static Assets plus D1.

Live demo:

```text
https://progressive-workout-coach.data-james.workers.dev
```

Useful commands:

```bash
npm run dev:cloudflare
npm run cf:d1:migrate:remote
npm run deploy
```

The D1 database is `progressive-workout-coach-db`, bound to the Worker as `DB`.

## GitHub Auto Deploy

Pushes to `main` deploy through `.github/workflows/deploy-cloudflare.yml`.

Add this GitHub repository secret before relying on automatic deploys:

```text
CLOUDFLARE_API_TOKEN
```

The token should be scoped to the Cloudflare account that owns `progressive-workout-coach` and needs permission to deploy Workers and access D1. The workflow runs:

```bash
npm ci
npm run lint
npm run build
npx wrangler d1 migrations apply progressive-workout-coach-db --remote
npx wrangler deploy
```

## Notes

- Logged-in users sync their app data to Cloudflare D1 so it is available from any device using the same account.
- Local Vite development still falls back to browser storage under the `progressive-workout-coach-db-v1` key.
- The app includes a service worker and web app manifest for PWA installation.
- There are no subscriptions, pricing plans, payment routes, or admin restrictions.
- Seed data includes 60 strength exercises across chest, back, shoulders, arms, legs, calves, and abs.
