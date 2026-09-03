# Step 4 — In‑Memory Tasks CRUD

Now the core of the project: full **C**reate / **R**ead / **U**pdate / **D**elete for tasks. To keep the focus on Express, the data lives in a **plain array in memory** for now — no database. We introduce **`express.Router()`**, split code into **route** and **controller** files, and use **`req.params`** and **`req.query`**.

> "In memory" means the tasks are gone the moment you stop the server. That's fine while we learn the routing — **Step 8** swaps the array for PostgreSQL and the data starts surviving restarts. The route and controller *shape* barely changes.

## The store — `src/store.js`

One module owns the array and hands out ids:

```js
// src/store.js
const tasks = [];
let nextId = 1;

module.exports = {
  tasks,
  nextId: () => nextId++,
};
```

That's the entire "database" for Steps 4–5.

## `express.Router()` — why

Putting every route in `app.js` doesn't scale. A **Router** is a mini Express app with its own `.get()`, `.post()`, `.use()` — you define routes on it, then **mount** it onto the main app under a base path.

Our structure:

```
src/
├── routes/
│   └── tasks.routes.js       maps HTTP methods+paths → controller functions
└── controllers/
    └── tasks.controller.js   the actual logic (reads/writes the store, sends responses)
```

**Route file** = "which URL calls which function". **Controller file** = "what that function does". Keeping them apart keeps each file small and testable.

```bash
mkdir src/routes src/controllers
```

## The controller — `src/controllers/tasks.controller.js`

```js
// src/controllers/tasks.controller.js
const { tasks, nextId } = require('../store');

function findTask(id) {
  return tasks.find((t) => t.id === Number(id));
}

// GET /api/tasks            (optional ?done=true|false)
exports.list = (req, res) => {
  let result = tasks;

  if (req.query.done === 'true' || req.query.done === 'false') {
    const want = req.query.done === 'true';
    result = result.filter((t) => t.isDone === want);
  }

  res.json(result);
};

// GET /api/tasks/:id
exports.getOne = (req, res) => {
  const task = findTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
};

// POST /api/tasks
exports.create = (req, res) => {
  const { title, description } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }

  const task = {
    id: nextId(),
    title: title.trim(),
    description: description ?? '',
    isDone: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);

  res.status(201).json(task);
};

// PATCH /api/tasks/:id
exports.update = (req, res) => {
  const task = findTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // apply only the fields that were sent
  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.description !== undefined) task.description = req.body.description;
  if (req.body.is_done !== undefined) task.isDone = Boolean(req.body.is_done);

  res.json(task);
};

// DELETE /api/tasks/:id
exports.remove = (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.splice(index, 1);
  res.status(204).end();               // No Content
};
```

### What to notice

- **`req.params.id`** — the `:id` from the URL path. Always a **string**, so we `Number(...)` it. Params identify *which* resource.
- **`req.query.done`** — the `?done=true` part. Query params are for **filtering / options**, always optional, also strings — note we compare to `'true'`.
- **`req.body`** — the parsed JSON, available because we registered `express.json()` in Step 3.
- **Generating an id** — `nextId()` just increments a counter. From Step 7 the database generates it for us.
- **Status codes**: `200` read/update, `201` create, `204` delete, `404` not found, `400` bad input.

## The route file — `src/routes/tasks.routes.js`

```js
// src/routes/tasks.routes.js
const express = require('express');
const tasks = require('../controllers/tasks.controller');

const router = express.Router();

router.get('/', tasks.list);
router.post('/', tasks.create);
router.get('/:id', tasks.getOne);
router.patch('/:id', tasks.update);
router.delete('/:id', tasks.remove);

module.exports = router;
```

Paths here are **relative to where the router is mounted**. We'll mount it at `/api/tasks`, so `router.get('/')` handles `GET /api/tasks` and `router.get('/:id')` handles `GET /api/tasks/:id`.

## Mount it — `src/app.js`

```js
// src/app.js
const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tasks', require('./routes/tasks.routes'));   // ← mount the router

module.exports = app;
```

Request flow for `POST /api/tasks`:

```
morgan → express.json() → tasks.routes.js (/api/tasks) → tasks.controller.create
```

## Test every endpoint

```bash
npm run dev
```

```bash
BASE=http://localhost:3000

# create
curl -X POST $BASE/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","description":"2 litres"}'
# {"id":1,"title":"Buy milk","description":"2 litres","isDone":false,"createdAt":"..."}

# create another, then list
curl -X POST $BASE/api/tasks -H "Content-Type: application/json" -d '{"title":"Walk dog"}'
curl $BASE/api/tasks

# filter
curl "$BASE/api/tasks?done=false"

# get one
curl $BASE/api/tasks/1

# update (partial — PATCH)
curl -X PATCH $BASE/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"is_done":true}'

# not found
curl -i $BASE/api/tasks/999          # HTTP/1.1 404

# delete
curl -i -X DELETE $BASE/api/tasks/2   # HTTP/1.1 204
```

Now **restart the server** (`rs` + Enter) and `curl $BASE/api/tasks` again — the list is empty. Everything was in memory. Phase 2 (Steps 6–8) fixes that.

## PATCH vs PUT

We used **`PATCH`** — send only the fields that change, the rest stay. **`PUT`** would mean "replace the whole task", so the client must send every field or it gets wiped. For task editing, `PATCH` is the natural fit. (You could add a `PUT` too; it's optional.)

## Status code summary for this resource

| Request | Success | Failure |
|---|---|---|
| `GET /api/tasks` | `200` + array (`[]` if none) | — |
| `GET /api/tasks/:id` | `200` + object | `404` |
| `POST /api/tasks` | `201` + created object | `400` (no title) |
| `PATCH /api/tasks/:id` | `200` + updated object | `404` |
| `DELETE /api/tasks/:id` | `204` | `404` |

## Where we are

```
src/
├── store.js                    ✅ in-memory tasks array
├── routes/tasks.routes.js      ✅ 5 routes → controller
├── controllers/tasks.controller.js  ✅ list, getOne, create, update, remove
└── app.js                      ✅ mounts /api/tasks
```

CRUD works — but the code still crashes ugly on some bad requests (try `POST` with malformed JSON: `-d '{"title":}'`). Step 5 adds proper validation and one central error handler.

---

**Concepts introduced here:** `express.Router()` · splitting routes into files · route vs controller · mounting a router with `app.use()` · `req.params` · `req.query` for filtering · in‑memory CRUD · generating ids · PATCH vs PUT · status codes per operation · handling "not found"

**Next:** [Step 5 — Validation & Error Handling →](/guide/05-validation-and-errors.md)
