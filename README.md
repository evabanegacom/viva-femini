# VívaFemme API

RESTful API for the VívaFemme menstrual health tracking app (NestJS + MongoDB).

**Prerequisites**
- Node.js 18+ (LTS recommended)
- npm (comes with Node.js)
- A running MongoDB instance (local or remote)

**Environment**
- `MONGODB_URI` (optional): MongoDB connection string. Defaults to `mongodb://localhost:27017/vivafemme`.
- `PORT` (optional): HTTP port. Defaults to `3000`.

**Install**

```bash
npm install
```

**Run (development)**

```bash
npm run start:dev
```

This runs the app with `ts-node`. The API will be available at `http://localhost:3000/api/v1` by default.

**Run (production)**

```bash
npm run build
npm run start:prod
```

**Other scripts**
- `npm run start` — run directly with `ts-node` (no watch)
- `npm run test` — placeholder (no tests configured)

**API docs (Swagger)**
- After starting the server, open: `http://localhost:<PORT>/api/docs`

**Seed demo data**
- The project includes a seed endpoint that creates demo data. It clears existing data first.

```bash
# POST to create demo data (use curl or Postman)
curl -X POST http://localhost:3000/api/v1/seed
```

**Notes & troubleshooting**
- If using a local MongoDB, ensure the server is running and reachable at the `MONGODB_URI` you provide.
- If you get TypeScript or runtime errors, confirm Node.js and package versions match the `package.json` devDependencies.

**Useful files**
- `src/app.module.ts` — DB connection uses `MONGODB_URI` (default `mongodb://localhost:27017/vivafemme`).
- `src/main.ts` — global prefix `api/v1`, Swagger setup at `/api/docs`.

**Environment example**
- A sample `.env.example` is included. Copy it to `.env` and edit values as needed.

**Repository**
- Source and project homepage: https://github.com/evabanegacom/viva-femini

If you'd like, I can also add a Makefile or an npm script to run the server with environment variables from `.env`.
