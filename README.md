# Angular Grocery Backend (Vercel)

Root directory for Vercel: `backend/angular-grocery-backend`

This project exposes a simple file-backed REST API using a serverless function at `api/index.js`. The `db.json` file is the data store.

Local test

```bash
cd backend/angular-grocery-backend
node run-local.js    # starts server on port 3000
# in another terminal
node test-local.js   # GET /groceries
```

Deploy to Vercel (CLI)

```bash
cd backend/angular-grocery-backend
npm install
# you may need to login first
npx vercel login
npx vercel --prod --confirm
```

Or deploy via Vercel Dashboard: set the Project Root to `backend/angular-grocery-backend`.

Notes
- This handler is intentionally lightweight and dependency-free. It supports GET/POST/PUT/PATCH/DELETE for top-level resources (e.g. `/groceries`).
- Concurrent writes can race; this is intended for development/demo only.
