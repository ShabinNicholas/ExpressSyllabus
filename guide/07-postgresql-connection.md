# Step 7 — Connecting to PostgreSQL with TypeORM

Our in‑memory API works, but every restart wipes it. Time to put the tasks in a real database. This step: create the database, describe the `tasks` table as a **TypeORM entity**, open a **DataSource** connection, and prove it works — with the table created automatically from the entity.

## Why a database instead of an in‑memory array

You already felt the main reason at the end of Step 4 — restart the server, the tasks are gone. There's more:

| `let tasks = []` (Steps 4–5) | PostgreSQL |
|---|---|
| **Wiped on every restart / crash / deploy** | Data persists |
| Each server instance has its own copy | One shared source of truth |
| Only `Array.filter` to query | Filtering, joins, sorting, indexes |
| No safety for concurrent writes | Transactions, constraints |
| No backups | Point‑in‑time recovery |

## Why an ORM (and why TypeORM)

An **ORM** (Object‑Relational Mapper) lets you work with **objects and methods** instead of SQL strings:

```js
// without an ORM (raw driver):
await db.query('INSERT INTO tasks (title) VALUES ($1) RETURNING *', ['Buy milk']);

// with TypeORM:
await taskRepo.save({ title: 'Buy milk' });
```

TypeORM:

- You describe each table **once** as an **entity**; TypeORM generates the SQL.
- Every value is **parameterized automatically** — no SQL‑injection risk to manage yourself.
- It manages the connection pool for you.
- In development it can **create and update the tables from your entities** (`synchronize: true`), so there's no separate schema file to keep in sync.

TypeORM is usually used with TypeScript and decorators. We're staying in plain JavaScript, so we use its **`EntitySchema`** API — the same features, described with plain objects.

## Install

```bash
npm install typeorm pg reflect-metadata
```

- **typeorm** — the ORM.
- **pg** — the PostgreSQL driver TypeORM uses under the hood.
- **reflect-metadata** — a small dependency TypeORM expects to be imported once at startup.

## Create the database

Install PostgreSQL if you haven't (`psql --version` to check), make sure it's running, then:

```bash
psql -U postgres

CREATE DATABASE task_manager;
\q
```

## Add `DATABASE_URL` to config

Add the line to `.env` **and** `.env.example`:

```bash
# .env  (and .env.example — use this exact dummy value there)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/task_manager
#            └─user─┘ └─pass──┘ └──host──┘ └po┘ └──database──┘
```

Adjust the user/password to match your local Postgres. Then make it a **required** variable in `config.js`:

```js
// src/config.js
const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,

  databaseUrl: required('DATABASE_URL'),   // ← now the app won't start without it
};
```

Remove `DATABASE_URL` from `.env` and restart — the app refuses to start with
`Missing required environment variable: DATABASE_URL`. That's fail‑fast working. Put it back.

## Describe the table as an entity — `src/entities/Task.js`

```js
// src/entities/Task.js
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Task',
  tableName: 'tasks',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,          // auto-incrementing (SERIAL) — the DB makes the id now
    },
    title: { type: 'varchar' },
    description: { type: 'varchar', default: '' },
    isDone: { name: 'is_done', type: 'boolean', default: false },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
  },
});
```

```bash
mkdir src/entities
```

Notice the property names are camelCase in JS (`isDone`) but map to snake_case columns (`is_done`) via `name`. `createDate: true` / `updateDate: true` make TypeORM manage those timestamps automatically.

> There's no `user` column here. Tasks don't belong to anyone yet — we add accounts in Step 9 and the `user` relation in Step 11.

## Open the connection — `src/data-source.js`

A **DataSource** is TypeORM's connection object — it holds the pool and knows about your entities.

```js
// src/data-source.js
require('reflect-metadata');
const { DataSource } = require('typeorm');
const config = require('./config');
const Task = require('./entities/Task');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  entities: [Task],
  synchronize: !config.isProd,   // dev: auto-create/update tables from entities
  logging: !config.isProd,       // dev: print the SQL TypeORM runs
  ssl: config.isProd ? { rejectUnauthorized: false } : false,
});

module.exports = { AppDataSource, Task };
```

> **`synchronize: true`** is a development convenience — TypeORM diffs your entities against the DB and applies the changes on startup. **Never use it in production** — a rename could drop a column and its data. In production you use **migrations**. That's why we guard it with `!config.isProd`.

## Initialize it before the server starts — `src/server.js`

```js
// src/server.js
const config = require('./config');
const { AppDataSource } = require('./data-source');
const app = require('./app');

async function start() {
  try {
    await AppDataSource.initialize();     // connect + (in dev) sync tables
    console.log('PostgreSQL connected via TypeORM');
  } catch (err) {
    console.error('Could not connect to the database:', err.message);
    process.exit(1);                      // fail fast — no point running without a DB
  }

  app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port} (${config.env})`);
  });
}

start();

// close the connection cleanly on Ctrl+C
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await AppDataSource.destroy();
  process.exit(0);
});
```

Run it:

```bash
npm run dev
```

Because `logging: true` and `synchronize: true`, on the first run you'll see TypeORM issue the `CREATE TABLE` statement, then:

```
PostgreSQL connected via TypeORM
Server listening on http://localhost:3000 (development)
```

Check the table exists:

```bash
psql -U postgres -d task_manager -c "\dt"
#  Schema | Name  | Type  |  Owner
# --------+-------+-------+----------
#  public | tasks | table | postgres
```

## Wire the database into `/health`

Make `/health` actually check the DB so it means "everything works", not just "Node is up".

```js
// src/app.js
const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const { AppDataSource } = require('./data-source');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(morgan(config.isProd ? 'combined' : 'dev'));
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await AppDataSource.query('SELECT 1');   // cheap round-trip to Postgres
    res.json({ status: 'ok', db: 'up' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

app.use('/api/tasks', require('./routes/tasks.routes'));

app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

module.exports = app;
```

```bash
curl http://localhost:3000/health
# {"status":"ok","db":"up"}
```

## The repository — a preview

To read and write a table you get its **repository** from the DataSource:

```js
const { AppDataSource, Task } = require('./data-source');

const taskRepo = AppDataSource.getRepository(Task);

await taskRepo.find();                       // SELECT * FROM tasks
await taskRepo.findOneBy({ id: 1 });         // ... WHERE id = 1
await taskRepo.save({ title: 'Buy milk' });  // INSERT
await taskRepo.remove(task);                 // DELETE
```

We rewrite the Tasks CRUD on these methods in Step 8. The routes and validation don't change — only the controller internals.

## Where we are

```
src/
├── entities/Task.js     ✅ tasks table description
├── data-source.js       ✅ DataSource, synchronize in dev
├── config.js            ✅ DATABASE_URL now required
├── app.js               ✅ /health checks the DB
└── server.js            ✅ initializes TypeORM before listening, closes on exit
```

Database connected, `tasks` table auto‑created from the entity. The CRUD routes still read the in‑memory array though — Step 8 moves them onto the repository.

---

**Concepts introduced here:** why a database over in‑memory storage · what an ORM is · installing TypeORM (`typeorm`, `pg`, `reflect-metadata`) · describing a table as an `EntitySchema` entity · the `DataSource` and `initialize()` · `synchronize` in dev vs migrations in prod · a required env var · testing the DB connection · graceful shutdown

**Next:** [Step 8 — Moving the CRUD to the Database →](/guide/08-tasks-crud-database.md)
