# Runnable examples

Three snapshots of the **Task Manager API** at the points where the project becomes a
working program you can run. The full step‑by‑step code for everything in between lives in
the [guide pages](../_sidebar.md) themselves.

| Folder | Matches | Needs a database? | Concepts up to here |
|---|---|---|---|
| [`01-in-memory-crud/`](01-in-memory-crud/) | end of **Step 5** | No | Express, routing, `express.Router()`, middleware, `express.json()`, in‑memory CRUD, validation, central error handler |
| [`02-database-crud/`](02-database-crud/) | end of **Step 8** | Yes — PostgreSQL | `.env` / config module, TypeORM `DataSource`, entities, the repository API, CRUD backed by Postgres |
| [`03-full-auth/`](03-full-auth/) | end of **Step 12** | Yes — PostgreSQL | bcrypt password hashing, register + login, JWT, `requireAuth` middleware, per‑user protected routes, production checklist |

## Running one

```bash
cd examples/01-in-memory-crud
npm install
npm run dev
```

`02` and `03` additionally need a local PostgreSQL and a `.env` file — copy `.env.example`
to `.env` and fill it in. Each folder has its own `README.md` with the details.
