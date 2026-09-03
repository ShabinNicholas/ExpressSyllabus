# Resources & Cheat Sheets

## Official docs

- [Express 4.x API reference](https://expressjs.com/en/4x/api.html)
- [Express guide: routing](https://expressjs.com/en/guide/routing.html)
- [Express guide: writing middleware](https://expressjs.com/en/guide/writing-middleware.html)
- [Express guide: error handling](https://expressjs.com/en/guide/error-handling.html)
- [TypeORM docs](https://typeorm.io/) · [EntitySchema](https://typeorm.io/separating-entity-definition) · [Repository API](https://typeorm.io/repository-api) · [Find options](https://typeorm.io/find-options)
- [PostgreSQL docs](https://www.postgresql.org/docs/)
- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [jwt.io](https://jwt.io/) — decode/inspect JWTs

## Packages used in the project

| Package | Purpose | Step |
|---|---|---|
| [`express`](https://www.npmjs.com/package/express) | The framework | 1 |
| [`nodemon`](https://www.npmjs.com/package/nodemon) | Auto-restart in dev (`--save-dev`) | 1 |
| [`morgan`](https://www.npmjs.com/package/morgan) | HTTP request logging | 3 |
| [`cors`](https://www.npmjs.com/package/cors) | Cross-origin requests | 3 |
| [`dotenv`](https://www.npmjs.com/package/dotenv) | Load `.env` files | 6 |
| [`typeorm`](https://www.npmjs.com/package/typeorm) | ORM — entities, DataSource, repositories | 7 |
| [`pg`](https://www.npmjs.com/package/pg) | PostgreSQL driver (used by TypeORM) | 7 |
| [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata) | Required by TypeORM at startup | 7 |
| [`bcrypt`](https://www.npmjs.com/package/bcrypt) / [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) | Password hashing | 9 |
| [`jsonwebtoken`](https://www.npmjs.com/package/jsonwebtoken) | Sign / verify JWTs | 10 |
| [`helmet`](https://www.npmjs.com/package/helmet) | Security headers | 12 |
| [`express-rate-limit`](https://www.npmjs.com/package/express-rate-limit) | Throttle requests | 12 |

```bash
npm install express dotenv typeorm pg reflect-metadata morgan cors bcrypt jsonwebtoken helmet express-rate-limit
npm install --save-dev nodemon
```

## Runnable examples

Three snapshots of the project you can run, one per phase plateau. Full code for every step in between is in the step pages.

| Folder | Matches | Needs Postgres? | `npm install && npm run dev` |
|---|---|---|---|
| `examples/01-in-memory-crud/` | end of [Step 5](guide/05-validation-and-errors.md) | No | ✅ runs immediately |
| `examples/02-database-crud/` | end of [Step 8](guide/08-tasks-crud-database.md) | Yes | `cp .env.example .env` first |
| `examples/03-full-auth/` | end of [Step 12](guide/12-review-and-deploy.md) | Yes | `cp .env.example .env`, set `JWT_SECRET` |

See `examples/README.md` and each folder's own README for details.

## HTTP status codes cheat sheet

### 2xx — Success
| Code | Name | Use it for |
|---|---|---|
| 200 | OK | Successful GET, PATCH, PUT |
| 201 | Created | Successful POST that created a resource |
| 204 | No Content | Success with nothing to return (often DELETE) |

### 4xx — Client error
| Code | Name | Use it for |
|---|---|---|
| 400 | Bad Request | Malformed JSON, failed validation |
| 401 | Unauthorized | Missing / invalid / expired token — *"who are you?"* |
| 403 | Forbidden | Authenticated but not permitted — *"I know you, and no"* |
| 404 | Not Found | No such resource or route |
| 409 | Conflict | Duplicate resource (e.g. email already registered) |
| 429 | Too Many Requests | Rate limit exceeded |

### 5xx — Server error
| Code | Name | Use it for |
|---|---|---|
| 500 | Internal Server Error | Unhandled exception |
| 503 | Service Unavailable | DB unreachable, maintenance |

## `curl` cheat sheet (Task Manager API)

```bash
BASE=http://localhost:3000

# health
curl $BASE/health

# register
curl -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}'

# login → save the token
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# authenticated requests
AUTH="Authorization: Bearer $TOKEN"

curl $BASE/api/tasks -H "$AUTH"                              # list
curl "$BASE/api/tasks?done=false" -H "$AUTH"                 # filter
curl $BASE/api/tasks/1 -H "$AUTH"                            # one

curl -X POST $BASE/api/tasks -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","description":"2 litres"}'          # create

curl -X PATCH $BASE/api/tasks/1 -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"is_done":true}'                                        # update

curl -X DELETE $BASE/api/tasks/1 -H "$AUTH"                   # delete

# -i shows status + headers; useful for checking 401 / 404 / 400
curl -i $BASE/api/tasks
```

## PostgreSQL cheat sheet

Tables are created by TypeORM (`synchronize: true` in dev) — there's no schema file to run.

```bash
# create the database (one time)
psql -U postgres -c "CREATE DATABASE task_manager;"

# connect
psql -U postgres -d task_manager

# one-off query from the shell
psql -U postgres -d task_manager -c "SELECT id, email FROM users;"

# reset all data (keep tables)
psql -U postgres -d task_manager -c "TRUNCATE tasks, users RESTART IDENTITY CASCADE;"

# drop the tables entirely (TypeORM recreates them next start in dev)
psql -U postgres -d task_manager -c "DROP TABLE IF EXISTS tasks, users CASCADE;"
```

```sql
-- inside psql
\dt              -- list tables
\d tasks         -- describe the tasks table
\q               -- quit
```

## TypeORM cheat sheet

```js
const repo = AppDataSource.getRepository(Task);

await repo.find({ where: { user: { id: 1 } }, order: { createdAt: 'DESC' } });
await repo.findOne({ where: { id: 5, user: { id: 1 } } });
await repo.findOneBy({ id: 5 });

const t = repo.create({ title: 'Buy milk', user: { id: 1 } });
await repo.save(t);              // INSERT, then UPDATE on subsequent saves

Object.assign(t, { isDone: true });
await repo.save(t);             // UPDATE

await repo.remove(t);           // DELETE
await repo.delete({ id: 5 });   // DELETE without loading first

// load a column marked select:false
await repo.findOne({ where: { email }, select: ['id', 'email', 'passwordHash'] });
```

```bash
# migrations (production path — separate checklist)
npx typeorm migration:generate src/migrations/Init -d src/data-source.js
npx typeorm migration:run -d src/data-source.js
```

## Generate a JWT secret

```bash
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploying this Docsify site to GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo **Settings → Pages → Build and deployment**.
3. **Source:** *Deploy from a branch*. **Branch:** `main`, **Folder:** `/ (root)`.
4. Save. Publishes at `https://<username>.github.io/<repo>/`.
5. The `.nojekyll` file (included) stops GitHub from running the site through Jekyll.
