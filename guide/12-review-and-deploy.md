# Step 12 — Review, Test & Deploy

The Task Manager API is done. This step: run the whole thing end to end, see every syllabus concept mapped to where we used it, and cover deployment.

## Full end‑to‑end test

```bash
# reset the database (optional)
psql -U postgres -d task_manager -c "TRUNCATE tasks, users RESTART IDENTITY CASCADE;"

npm run dev
```

```bash
BASE=http://localhost:3000

# 1. health
curl -s $BASE/health
# {"status":"ok","db":"up"}

# 2. register
curl -s -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}'
# {"id":1,"email":"alice@example.com","createdAt":"..."}

# 3. login → capture token
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
echo "$TOKEN"

AUTH="Authorization: Bearer $TOKEN"

# 4. create tasks
curl -s -X POST $BASE/api/tasks -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","description":"2 litres"}'
curl -s -X POST $BASE/api/tasks -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"title":"Walk the dog"}'

# 5. list
curl -s $BASE/api/tasks -H "$AUTH"

# 6. update (mark done)
curl -s -X PATCH $BASE/api/tasks/1 -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"is_done":true}'

# 7. filter
curl -s "$BASE/api/tasks?done=true" -H "$AUTH"

# 8. delete
curl -si -X DELETE $BASE/api/tasks/2 -H "$AUTH" | head -1  # 204

# 9. failure paths
curl -si $BASE/api/tasks | head -1                       # 401 (no token)
curl -si $BASE/api/tasks/999 -H "$AUTH" | head -1         # 404
curl -si -X POST $BASE/api/tasks -H "$AUTH" \
  -H "Content-Type: application/json" -d '{}' | head -1   # 400
```

If all of that behaves, the project works.

## Every syllabus concept → where we built it

| Concept | Step |
|---|---|
| What Express is, Express vs `http`, install, structure, nodemon | [1](/guide/01-project-setup.md) |
| `express()`, `app.listen()`, choosing a port | [2](/guide/02-first-server.md) |
| Basic routing, `(req, res)`, `res.send()`, `res.status()` | [2](/guide/02-first-server.md) |
| What middleware is, `(req, res, next)`, `app.use()`, order | [3](/guide/03-json-and-middleware.md) |
| `express.json()`, `req.body`, `res.json()`, Content‑Type | [3](/guide/03-json-and-middleware.md) |
| Built‑in vs third‑party (`morgan`, `cors`) middleware | [3](/guide/03-json-and-middleware.md) |
| `express.Router()`, route/controller split, mounting | [4](/guide/04-tasks-crud-in-memory.md) |
| CRUD, `req.params`, `req.query`, status codes, PATCH vs PUT | [4](/guide/04-tasks-crud-in-memory.md) · [8](/guide/08-tasks-crud-database.md) |
| "Not found" handling, generating ids | [4](/guide/04-tasks-crud-in-memory.md) |
| `HttpError`, validation, 404 handler, 4‑arg error handler | [5](/guide/05-validation-and-errors.md) |
| try / catch, `next(err)`, async errors (`asyncHandler`) | [5](/guide/05-validation-and-errors.md) · [8](/guide/08-tasks-crud-database.md) |
| `process.env`, `.env`, `dotenv`, PORT config, `.env.example` | [6](/guide/06-config-and-env.md) |
| Separating config from code, dev vs prod, `.gitignore` for `.env` | [6](/guide/06-config-and-env.md) |
| Why a DB over in‑memory, what an ORM is, installing TypeORM | [7](/guide/07-postgresql-connection.md) |
| Entities, `DataSource`, connecting, testing the connection | [7](/guide/07-postgresql-connection.md) |
| Env vars for the DB connection | [6](/guide/06-config-and-env.md) · [7](/guide/07-postgresql-connection.md) |
| CRUD with a database (repository API), parameterization | [8](/guide/08-tasks-crud-database.md) |
| Combining / nesting routers | [9](/guide/09-password-hashing-register.md) |
| Password hashing, why plain text is unsafe, bcrypt, salt rounds | [9](/guide/09-password-hashing-register.md) |
| Hashing before saving, `select: false`, register route | [9](/guide/09-password-hashing-register.md) |
| `bcrypt.compare` on login, login route | [10](/guide/10-login-and-jwt.md) |
| JWT basics, signing a token, verifying a token, storing it | [10](/guide/10-login-and-jwt.md) |
| Relations / foreign keys | [11](/guide/11-protecting-routes.md) |
| Protecting routes (auth middleware), `router.use()`, custom middleware | [11](/guide/11-protecting-routes.md) |
| Ownership checks in the query, 401 vs 403 | [11](/guide/11-protecting-routes.md) |

## Production checklist

- [ ] `NODE_ENV=production` set
- [ ] Real, random `JWT_SECRET` (`openssl rand -hex 32`) — never the `.env.example` value
- [ ] `DATABASE_URL` points at the production database, with SSL
- [ ] `.env` is **not** in the repo; secrets set in the host's dashboard
- [ ] `BCRYPT_SALT_ROUNDS` ≥ 12
- [ ] `helmet` added (`npm i helmet`, `app.use(helmet())`) for security headers
- [ ] Rate‑limit `/api/auth/login` (`npm i express-rate-limit`) to slow brute force
- [ ] HTTPS in front of the app (the platform usually provides this)
- [ ] `npm start` (not `nodemon`) as the start command
- [ ] **`synchronize` is off in production** (`data-source.js` already guards it with `!config.isProd`) — create the prod tables with a migration instead

### helmet + rate limit (quick add)

```bash
npm install helmet express-rate-limit
```

```js
// src/app.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());
app.use(morgan(config.isProd ? 'combined' : 'dev'));
app.use(express.json());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/api/auth/login', loginLimiter);
```

## Deploying the API

Any Node host works (Render, Railway, Fly.io, a VPS). General steps:

1. Push the repo to GitHub.
2. Create a PostgreSQL instance on the host (or a managed one like Neon / Supabase). Copy its connection string.
3. On the host, set env vars: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`. Do **not** set `PORT` — the platform assigns it and our code reads `process.env.PORT`.
4. Set the start command to `npm start`.
5. Create the production tables. Either run a TypeORM **migration** (`npx typeorm migration:run -d src/data-source.js`), or — for a first deploy only — temporarily start the app once with `synchronize` allowed to let TypeORM create them.
6. Hit `https://your-app.example.com/health` — expect `{"status":"ok","db":"up"}`.

## Where to go next

- **PostgreSQL / TypeORM deep‑dive** (separate checklist): migrations, relations & eager/lazy loading, the query builder, transactions, indexes, seeding.
- **Refresh tokens** — short access token + long refresh token.
- **Automated tests** — `jest` + `supertest` against `app` (this is why `app.js` and `server.js` are separate).
- **Pagination** on `GET /api/tasks` (`?page=`, `?limit=`).
- **OpenAPI / Swagger** docs for the API.

---

**You've built:** a complete, production‑shaped Express + TypeORM + PostgreSQL REST API — starting from a plain in‑memory CRUD, then a real database, then hashed passwords, JWT auth, and protected per‑user resources, with validation and centralized error handling throughout.

**Back to:** [Home](/README.md) · [Syllabus coverage](/checklist.md)
