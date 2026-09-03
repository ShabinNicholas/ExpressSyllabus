# 02 — Database-backed CRUD

Snapshot of the Task Manager API at the **end of Step 8**.

- Tasks are stored in **PostgreSQL**, accessed through a **TypeORM** repository. Data now
  survives a restart.
- Still no authentication and no `users` table — that starts in Step 9.

## Setup

```bash
npm install

# create the database (one time)
psql -U postgres -c "CREATE DATABASE task_manager;"

cp .env.example .env      # then edit DATABASE_URL if your Postgres credentials differ
```

## Run it

```bash
npm run dev
```

On the first start TypeORM creates the `tasks` table from `src/entities/Task.js`
(`synchronize` is on in development).

## Try it

Same requests as example 01 — `POST/GET/PATCH/DELETE /api/tasks`, `?done=` filter — but
now `curl $BASE/health` also reports the database status, and the data is still there after
you stop and restart the server.

## What changed from example 01

| | 01 | 02 |
|---|---|---|
| storage | `src/store.js` array | `src/entities/Task.js` + Postgres |
| controller | array `push` / `find` / `splice` | `repo.create` / `find` / `findOne` / `save` / `remove` |
| new files | — | `src/config.js`, `src/data-source.js`, `src/entities/Task.js` |
