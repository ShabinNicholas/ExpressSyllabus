# Step 5 — Validation & Error Handling

Right now a bad request can leak an ugly stack trace or an inconsistent response. This step makes the API respond cleanly: validate input in one reusable place, represent failures as **one error type**, funnel everything to **one error handler**, and add a **404** for unknown routes.

## The idea: throw, don't hand‑write every response

In Step 4 each controller wrote its own `res.status(400).json(...)` / `res.status(404).json(...)`. That spreads response formatting across every function. Instead we'll:

1. Define a small **`HttpError`** class that carries a status code.
2. `throw new HttpError(404, 'Task not found')` from anywhere.
3. Let **one** error‑handling middleware turn any thrown error into a JSON response.

Express 4 automatically catches errors **thrown synchronously** inside a route handler and sends them to the error handler. (Our handlers are synchronous right now. In Step 8 they become `async` — we add a one‑line wrapper there so rejected promises are caught too.)

## An error class — `src/errors/HttpError.js`

```js
// src/errors/HttpError.js
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
```

```bash
mkdir src/errors
```

## Validation — one function, reused

Validate the request body **before** touching the store. Keep it in a small function so `create` and `update` share it.

```js
// src/controllers/tasks.controller.js  (add near the top)
const HttpError = require('../errors/HttpError');

function validateTaskInput(body, { partial = false } = {}) {
  const data = {};

  // title: required on create, optional on PATCH — but if present, must be valid
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
    data.isDone = body.is_done;      // internal property is camelCase
  }

  return data;
}
```

`validateTaskInput` returns exactly the fields to apply, already cleaned.

## The updated controller — `src/controllers/tasks.controller.js`

The handlers get shorter: no inline status codes, just `throw` and the happy path.

```js
// src/controllers/tasks.controller.js
const { tasks, nextId } = require('../store');
const HttpError = require('../errors/HttpError');

// ... validateTaskInput from above ...

function findTask(id) {
  return tasks.find((t) => t.id === Number(id));
}

exports.list = (req, res) => {
  let result = tasks;
  if (req.query.done === 'true' || req.query.done === 'false') {
    const want = req.query.done === 'true';
    result = result.filter((t) => t.isDone === want);
  }
  res.json(result);
};

exports.getOne = (req, res) => {
  const task = findTask(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  res.json(task);
};

exports.create = (req, res) => {
  const data = validateTaskInput(req.body);           // throws 400 on bad input

  const task = {
    id: nextId(),
    title: data.title,
    description: data.description ?? '',
    isDone: data.isDone ?? false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  res.status(201).json(task);
};

exports.update = (req, res) => {
  const data = validateTaskInput(req.body, { partial: true });
  if (Object.keys(data).length === 0) {
    throw new HttpError(400, 'No updatable fields provided');
  }

  const task = findTask(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');

  Object.assign(task, data);        // apply the validated fields
  res.json(task);
};

exports.remove = (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) throw new HttpError(404, 'Task not found');

  tasks.splice(index, 1);
  res.status(204).end();
};
```

> For bigger projects a schema library ([zod](https://zod.dev/), [joi](https://joi.dev/), [express-validator](https://express-validator.github.io/)) replaces hand‑written checks. The principle is the same: reject bad input early with a `400`.

## 404 for unknown routes

A request that matches **no route** (e.g. `GET /api/nonsense`) currently falls through to a default. Add a catch‑all **after** all routes:

```js
// src/app.js — after app.use('/api/tasks', ...)
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});
```

This is normal middleware with no path — it runs only if nothing above it responded.

## The central error handler — `src/middleware/errorHandler.js`

Express recognises an **error‑handling middleware** by its **four** parameters: `(err, req, res, next)`. Register it **last**.

```js
// src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  // malformed JSON caught by express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  const status = err.status || 500;

  if (status === 500) {
    console.error(err);            // log the real error server-side
  }

  const body = { error: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV !== 'production' && status === 500) {
    body.stack = err.stack;        // stack traces only outside production
  }

  res.status(status).json(body);
};
```

```bash
mkdir src/middleware
```

> We'll add one more branch to this handler in Step 8 — a Postgres unique‑constraint violation (`err.code === '23505'`) → `409 Conflict`. It doesn't apply yet because there's no database.

## Wire it into `src/app.js`

```js
// src/app.js
const express = require('express');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tasks', require('./routes/tasks.routes'));

// unknown route → 404
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// central error handler — MUST be the last app.use()
app.use(errorHandler);

module.exports = app;
```

Now:

- Controllers `throw new HttpError(404, '...')` → client gets `{"error":"Task not found"}` with status `404`.
- Bad input → `validateTaskInput` throws `HttpError(400, ...)` → clean `400`.
- Malformed JSON → `400 {"error":"Invalid JSON in request body"}`.
- Anything unexpected → generic `500`, real error logged server‑side, no internals leaked in production.

## Test the failure paths

```bash
BASE=http://localhost:3000

# missing title → 400
curl -i -X POST $BASE/api/tasks -H "Content-Type: application/json" -d '{}'

# malformed JSON → 400
curl -i -X POST $BASE/api/tasks -H "Content-Type: application/json" -d '{"title":}'

# unknown route → 404
curl -i $BASE/api/nope

# unknown task → 404
curl -i $BASE/api/tasks/999
```

## Where we are

```
src/
├── store.js
├── errors/HttpError.js          ✅ status-carrying Error
├── middleware/errorHandler.js   ✅ one place that formats every error
├── controllers/tasks.controller.js  ✅ validate + throw, no inline status codes
├── routes/tasks.routes.js
└── app.js                       ✅ 404 handler + error handler wired
```

**This is the end of the in‑memory phase.** The API is complete, validated, and crash‑resistant — [`examples/01-in-memory-crud/`](/resources.md#runnable-examples) is exactly this. The one thing it can't do is remember anything across a restart. Phase 2 fixes that: Step 6 sets up configuration, Step 7 connects PostgreSQL, Step 8 moves the CRUD onto it.

---

**Concepts introduced here:** an `HttpError` class · input validation in a reusable function · `throw` instead of inline error responses · synchronous error catching in Express 4 · 404 handler for unknown routes · the 4‑argument error‑handling middleware · one central error handler · hiding internals in production

**Next:** [Step 6 — Config & Environment Variables →](/guide/06-config-and-env.md)
