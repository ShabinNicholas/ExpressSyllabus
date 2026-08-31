# 9. Connecting to a Database

This chapter is a **preview** — it bridges from the in‑memory arrays you've used so far to a real database. The detailed PostgreSQL work is a separate checklist.

## Why use a database instead of in‑memory storage

Everything you've built stores data in a JS array. That means:

| In‑memory array | Real database |
|---|---|
| **Lost on every restart / crash / deploy** | Persists |
| Gone when the process scales to 2+ instances (each has its own array) | Shared across instances |
| No querying beyond `Array.filter` | Indexes, joins, aggregation, full‑text search |
| No concurrent‑write safety | Transactions, locking, constraints |
| No backups | Point‑in‑time recovery |
| Fine for demos and tests | Required for anything real |

The moment you deploy, or need data to survive a restart, you need a database.

## Choosing: driver vs ORM vs query builder

| Approach | What it is | Examples |
|---|---|---|
| **Driver** | Raw SQL, you write the queries | `pg` (Postgres), `mysql2`, `better-sqlite3` |
| **Query builder** | Programmatic SQL, still close to the metal | `knex`, `kysely` |
| **ORM** | Models/objects, migrations, relations | `prisma`, `sequelize`, `typeorm`, `drizzle` |

For learning SQL, start with the **driver** (`pg`). For app productivity, an ORM like **Prisma** removes boilerplate.

## Installing a DB driver / ORM

<!-- tabs:start -->

#### **pg (driver)**

```bash
npm install pg
```

#### **Prisma (ORM)**

```bash
npm install @prisma/client
npm install --save-dev prisma
npx prisma init
```

#### **Sequelize (ORM)**

```bash
npm install sequelize pg pg-hstore
```

<!-- tabs:end -->

## Environment variables for DB connection

The connection string is a **secret** — it goes in `.env`, never in code (see [Chapter 7](guide/07-environment-variables.md)).

```bash
# .env
DATABASE_URL=postgres://username:password@localhost:5432/mydb
```

```bash
# .gitignore
.env
```

Connection‑string anatomy:

```
postgres://username:password@host:5432/database?sslmode=require
           └── user ──┘ └pw┘ └host┘ port └ db name ┘ └ options ┘
```

## Connecting Express to a database

### With `pg` — a connection pool

A **pool** keeps a set of reusable connections open so you don't pay the handshake cost per request.

```js
// src/db.js
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.db.url,
  max: 10,                     // max simultaneous connections
  idleTimeoutMillis: 30000,
  ssl: config.isProd ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
```

### With Prisma — a single client

```js
// src/db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
generator client { provider = "prisma-client-js" }

model Book {
  id    Int    @id @default(autoincrement())
  title String
  year  Int?
}
```

```bash
npx prisma migrate dev --name init   # creates the table
```

## Testing the DB connection

Run a trivial query on startup and fail fast if it doesn't work.

```js
// src/db.js  (pg)
async function testConnection() {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    console.log('DB connected at', rows[0].now);
  } catch (err) {
    console.error('DB connection FAILED:', err.message);
    process.exit(1);
  }
}
module.exports = { query: (t, p) => pool.query(t, p), pool, testConnection };
```

```js
// src/server.js
require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./db');

(async () => {
  await testConnection();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
})();
```

A health endpoint that checks the DB is handy for deploy platforms:

```js
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});
```

## Basic CRUD with a database (preview)

The **route shape stays identical** to [Chapter 2](guide/02-basic-crud.md) — only the data access changes. Every call is now `async`, so wrap handlers (see [Chapter 6](guide/06-error-handling.md)).

### With `pg` (raw SQL)

```js
// src/controllers/books.controller.js
const db = require('../db');

// GET /books
exports.list = async (req, res) => {
  const { rows } = await db.query('SELECT * FROM books ORDER BY id');
  res.json(rows);
};

// GET /books/:id
exports.get = async (req, res) => {
  const { rows } = await db.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });
  res.json(rows[0]);
};

// POST /books
exports.create = async (req, res) => {
  const { title, year } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const { rows } = await db.query(
    'INSERT INTO books (title, year) VALUES ($1, $2) RETURNING *',
    [title, year ?? null]
  );
  res.status(201).json(rows[0]);
};

// PUT /books/:id
exports.update = async (req, res) => {
  const { title, year } = req.body;
  const { rows } = await db.query(
    'UPDATE books SET title = $1, year = $2 WHERE id = $3 RETURNING *',
    [title, year ?? null, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });
  res.json(rows[0]);
};

// DELETE /books/:id
exports.remove = async (req, res) => {
  const { rows } = await db.query(
    'DELETE FROM books WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });
  res.json(rows[0]);
};
```

> **Always use parameterized queries** (`$1`, `$2`, …). Never build SQL with string concatenation / template literals — that's how SQL injection happens.
> ```js
> // ❌ NEVER
> db.query(`SELECT * FROM books WHERE id = ${req.params.id}`);
> // ✅ ALWAYS
> db.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
> ```

### With Prisma (ORM)

```js
const prisma = require('../db');

exports.list   = async (req, res) => res.json(await prisma.book.findMany());

exports.get = async (req, res) => {
  const book = await prisma.book.findUnique({ where: { id: Number(req.params.id) } });
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
};

exports.create = async (req, res) => {
  const book = await prisma.book.create({ data: { title: req.body.title, year: req.body.year } });
  res.status(201).json(book);
};

exports.update = async (req, res) => {
  const book = await prisma.book.update({
    where: { id: Number(req.params.id) },
    data: { title: req.body.title, year: req.body.year },
  });
  res.json(book);
};

exports.remove = async (req, res) => {
  await prisma.book.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
};
```

### Graceful shutdown

Close DB connections when the process stops:

```js
process.on('SIGINT', async () => {
  await pool.end();          // or prisma.$disconnect()
  process.exit(0);
});
```

## What comes next (separate PostgreSQL checklist)

- Creating tables & schema design
- Migrations
- Relationships (one‑to‑many, many‑to‑many) and JOINs
- Indexes and query performance
- Transactions
- Connection pooling in production
- Seeding data
- Repository / model layer patterns

---

### Checklist for this chapter

- [ ] Why use a database instead of in‑memory storage
- [ ] Installing a DB driver / ORM
- [ ] Connecting Express to a database
- [ ] Environment variables for DB connection
- [ ] Testing the DB connection
- [ ] Basic CRUD with a database (preview)

**Back to:** [Home](README.md) · [Checklist](checklist.md)
