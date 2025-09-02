Golden Rules — Démarrage & Accès (PostgreSQL)

Objectif
- Démarrer systématiquement l’API (serveur autoritaire), Prisma, et le client avant tout test de jeu.
- Base utilisée en DEV: PostgreSQL `SHACKERS` (schema `public`).

Configuration
- Créer `server/.env` avec:
  - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/SHACKERS?schema=public"`
  - `JWT_SECRET="change-me"`
  - `PORT=4000`

Démarrage (toujours dans cet ordre)
1) API + DB
   - `cd server`
   - `npm install`
   - `npx prisma generate`
   - `npx prisma db push` (ajouter `--accept-data-loss` si demandé)
   - `npm run dev`

2) Client (Vite)
   - `cd ..`
   - `npm install`
   - `npm run dev`

Accès
- API (health): `http://localhost:4000/api`
- UI de test API (Register/Login, Create Brute, Fight): `http://localhost:4000`
- Frontend (Phaser + Spine): `http://localhost:5174`

Technos côté client
- Phaser 3.80 + Spine 2D (plugin `@esotericsoftware/spine-phaser`)
- Assets Spine: `assets/spine/spineboy-pro.json`, `spineboy.atlas`, etc.

Règle d’or
- Pas de test gameplay si l’API n’est pas démarrée et connectée (Prisma → SHACKERS).
- PRNG seedé obligatoire dans le moteur serveur pour replays déterministes (quand activé).
