# Step 8 — Moving the CRUD to the Database

The `tasks` table exists (Step 7) but our controller still reads `src/store.js`. This step swaps the array for a **TypeORM repository**. The routes, the validation function, and the response shapes stay the same — only *where the data lives* changes.

## The repository

From the DataSource you get a **repository** per entity — the object you call to read and write that table:

```js
const { AppDataSource, Task } = require('../data-source');

const taskRepo = () => AppDataSource.getRepository(Task);
```

Methods we'll use:

| Method | SQL it runs (roughly) |
|---|---|
| `repo.find({ where, order })` | `SELECT ... WHERE ... ORDER BY ...` |
| `repo.findOne({ where })` | `SELECT ... WHERE ... LIMIT 1` |
| `repo.create(obj)` | *(builds an entity in memory — no SQL)* |
| `repo.save(entity)` | `INSERT` (new) or `UPDATE` (existing) |
| `repo.remove(entity)` | `DELETE` |

Every value you pass is **parameterized by TypeORM** — you never assemble a query string, so SQL injection isn't a risk you have to manage.

## Async controllers need a catch — `asyncHandler`

Repository calls are `async`. If a query rejects (DB down, a constraint violation), Express 4 does **not** catch it automatically inside an `async` handler — the request would hang. One tiny wrapper fixes every handler at once:

```js
// src/middleware/asyncHandler.js
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

It runs the handler and forwards any rejection (or thrown `HttpError`) to `next` — which sends it to the error handler from Step 5.

> Express 5 forwards async rejections natively, making this wrapper unnecessary. On Express 4 (what most projects still use) it's the standard trick.

## The route file — wrap each handler

```js
// src/routes/tasks.routes.js
const express = require('express');
const tasks = require('../controllers/tasks.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(tasks.list));
router.post('/', asyncHandler(tasks.create));
router.get('/:id', asyncHandler(tasks.getOne));
router.patch('/:id', asyncHandler(tasks.update));
router.delete('/:id', asyncHandler(tasks.remove));

module.exports = router;
```

## The controller — `src/controllers/tasks.controller.js`

Same structure as Step 5, but the store is now the repository. `validateTaskInput` is unchanged — copy it across as‑is.

```js
// src/controllers/tasks.controller.js
const { AppDataSource, Task } = require('../data-source');
const HttpError = require('../errors/HttpError');

const taskRepo = () => AppDataSource.getRepository(Task);

function validateTaskInput(body, { partial = false } = {}) {
  const data = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      throw new HttpError(400, 'title is required and must be a non-empty string');
    }
    data.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      throw new HttpError(400, 'description must be a string');
    }
    data.description = body.description;
  }
  if (body.is_done !== undefined) {
    if (typeof body.is_done !== 'boolean') {
      throw new HttpError(400, 'is_done must be a boolean');
    }
    data.isDone = body.is_done;
  }
  return data;
}

// GET /api/tasks            (optional ?done=true|false)
exports.list = async (req, res) => {
  const where = {};
  if (req.query.done === 'true' || req.query.done === 'false') {
    where.isDone = req.query.done === 'true';
  }

  const tasks = await taskRepo().find({ where, order: { createdAt: 'DESC' } });
  res.json(tasks);
};

// GET /api/tasks/:id
exports.getOne = async (req, res) => {
  const task = await taskRepo().findOne({ where: { id: Number(req.params.id) } });
  if (!task) throw new HttpError(404, 'Task not found');
  res.json(task);
};

// POST /api/tasks
exports.create = async (req, res) => {
  const data = validateTaskInput(req.body);

  const task = taskRepo().create(data);
  await taskRepo().save(task);          // INSERT — task.id, createdAt now populated

  res.status(201).json(task);
};

// PATCH /api/tasks/:id
exports.update = async (req, res) => {
  const data = validateTaskInput(req.body, { partial: true });
  if (Object.keys(data).length === 0) {
    throw new HttpError(400, 'No updatable fields provided');
  }

  const task = await taskRepo().findOne({ where: { id: Number(req.params.id) } });
  if (!task) throw new HttpError(404, 'Task not found');

  Object.assign(task, data);
  await taskRepo().save(task);          // UPDATE (also refreshes updated_at)
  res.json(task);
};

// DELETE /api/tasks/:id
exports.remove = async (req, res) => {
  const task = await taskRepo().findOne({ where: { id: Number(req.params.id) } });
  if (!task) throw new HttpError(404, 'Task not found');

  await taskRepo().remove(task);
  res.status(204).end();
};
```

### What changed from Step 5

| | in‑memory (Step 5) | database (Step 8) |
|---|---|---|
| find all | `tasks` / `tasks.filter(...)` | `repo.find({ where, order })` |
| find one | `tasks.find(t => t.id === id)` | `repo.findOne({ where: { id } })` |
| create | `tasks.push({...})` | `repo.create(data)` then `repo.save(task)` |
| update | mutate object in place | mutate loaded entity, then `repo.save(task)` |
| delete | `tasks.splice(index, 1)` | `repo.remove(task)` |
| the id | `nextId()` counter | `generated: true` — Postgres assigns it |

`src/store.js` is no longer used — delete it.

## Add the duplicate‑key branch to the error handler

Now that a database is involved, a `UNIQUE` constraint can fire (it will matter for user emails in Step 9). Add one branch to `src/middleware/errorHandler.js`:

```js
// src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  // Postgres unique-constraint violation surfacing through TypeORM
  if (err.code === '23505') {
    return res.status(409).json({ error: 'That resource already exists' });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);

  const body = { error: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV !== 'production' && status === 500) {
    body.stack = err.stack;
  }
  res.status(status).json(body);
};
```

## Test every endpoint

Same curl calls as Step 4 — the behaviour is identical:

```bash
BASE=http://localhost:3000

curl -X POST $BASE/api/tasks -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","description":"2 litres"}'

curl -X POST $BASE/api/tasks -H "Content-Type: application/json" -d '{"title":"Walk dog"}'
curl $BASE/api/tasks
curl "$BASE/api/tasks?done=false"
curl $BASE/api/tasks/1
curl -X PATCH $BASE/api/tasks/1 -H "Content-Type: application/json" -d '{"is_done":true}'
curl -i $BASE/api/tasks/999          # 404
curl -i -X DELETE $BASE/api/tasks/2   # 204
```

Now the difference that matters: **stop the server and start it again**. `curl $BASE/api/tasks` still returns your tasks. Confirm in psql:

```bash
psql -U postgres -d task_manager -c "SELECT id, title, is_done FROM tasks;"
```

## Where we are

```
src/
├── entities/Task.js
├── data-source.js
├── middleware/
│   ├── asyncHandler.js       ✅ new — forwards async errors
│   └── errorHandler.js       ✅ + 23505 → 409 branch
├── controllers/tasks.controller.js  ✅ repository-backed, same routes & validation
└── routes/tasks.routes.js    ✅ handlers wrapped in asyncHandler
```

This is [`examples/02-database-crud/`](/resources.md#runnable-examples). CRUD is now durable. Next we add accounts — starting with password hashing and the register route.

---

**Concepts introduced here:** the TypeORM repository API (`find`, `findOne`, `create`, `save`, `remove`) · swapping a storage layer without touching the routes · `asyncHandler` for async error catching · DB‑generated ids · automatic query parameterization · `23505` unique‑violation → `409`

**Next:** [Step 9 — Password Hashing & Registration →](/guide/09-password-hashing-register.md)
