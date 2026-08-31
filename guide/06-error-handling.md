# 6. Error Handling

A production API should **never** crash on a bad request and should **always** return a clear status code + message. Express has a dedicated mechanism for this.

## `try / catch` in routes

Any synchronous throw inside a route is caught by Express automatically and sent to the error handler. But for **async** code you must catch it yourself (or use a wrapper — see below).

```js
app.get('/books/:id', async (req, res, next) => {
  try {
    const book = await db.findBook(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    next(err); // hand off to the error-handling middleware
  }
});
```

## Passing errors with `next(err)`

Calling `next()` with **any argument** tells Express "something went wrong — skip all remaining normal middleware and run the error handler."

```js
app.get('/secret', (req, res, next) => {
  if (!req.user) {
    const err = new Error('Not authenticated');
    err.status = 401;
    return next(err);
  }
  res.send('secret');
});
```

`next('some string')` is special (it means "skip to next route"), so always pass an `Error` object.

## Error‑handling middleware (4 parameters)

Express identifies an error handler purely by its **arity** — it takes **four** arguments: `(err, req, res, next)`. Register it **last**, after all routes.

```js
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});
```

You can register more than one; Express calls them in order, and each may `next(err)` to the following one.

## 404 Not Found handling

A request that matches **no route** falls through to the bottom. Catch it with a normal (non‑error) middleware placed after all routes but before the error handler:

```js
app.use((req, res, next) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});
```

Or route it through the error handler for consistency:

```js
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

app.use((req, res, next) => {
  next(new HttpError(404, `Route ${req.originalUrl} not found`));
});
```

## Centralized error handler

Keep **one** place that turns errors into responses. Everything else just throws or calls `next(err)`.

```js
// src/errors/HttpError.js
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
module.exports = HttpError;
```

```js
// src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  // parser errors from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const status = err.status || 500;
  const payload = { error: err.message || 'Internal Server Error' };

  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== 'production' && status === 500) {
    payload.stack = err.stack;
  }

  if (status === 500) console.error(err);

  res.status(status).json(payload);
};
```

```js
// src/app.js
app.use('/api', require('./routes'));
app.use((req, res, next) => next(new HttpError(404, 'Not found')));
app.use(require('./middleware/errorHandler'));
```

Then routes stay clean:

```js
const HttpError = require('../errors/HttpError');

exports.get = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) throw new HttpError(404, 'Book not found');
    res.json(book);
  } catch (err) {
    next(err);
  }
};
```

## Sending proper status codes

| Situation | Status |
|---|---|
| Validation failed / bad input | `400` |
| No / invalid auth token | `401` |
| Authenticated but not permitted | `403` |
| Resource or route not found | `404` |
| Method not allowed on this path | `405` |
| Duplicate / conflicting resource | `409` |
| Unhandled exception, DB down | `500` |

Set it via `err.status` and let the central handler apply it, or `res.status(...)` directly in the route.

## Custom error messages

Design a **consistent error shape** and stick to it across every endpoint:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "title", "message": "is required" },
    { "field": "year", "message": "must be an integer" }
  ]
}
```

```js
function validate(body) {
  const details = [];
  if (!body.title) details.push({ field: 'title', message: 'is required' });
  if (body.year && !Number.isInteger(body.year))
    details.push({ field: 'year', message: 'must be an integer' });

  if (details.length) {
    throw new HttpError(400, 'Validation failed', details);
  }
}
```

Don't leak internals (stack traces, SQL, file paths) to clients in production — log those server‑side, send a generic message.

## Handling async errors

An unhandled rejection inside an `async` handler **does not** reach Express on its own (in Express 4). Options:

### 1. `try/catch` + `next(err)` in every async route

Explicit, verbose (shown above).

### 2. A wrapper function (recommended)

```js
// src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
```

```js
const asyncHandler = require('../utils/asyncHandler');

router.get('/:id', asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new HttpError(404, 'Book not found');
  res.json(book);
}));
```

No `try/catch` needed — any rejection is forwarded to the error handler automatically.

### 3. `express-async-errors`

```bash
npm install express-async-errors
```

```js
require('express-async-errors'); // patch Express — put at the top of app.js
```

Now plain `async` route handlers forward rejections automatically.

> Express 5 (still stabilising) forwards rejected promises from async handlers natively, making wrappers unnecessary.

### Last‑resort process‑level guards

```js
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1); // let a process manager restart a clean instance
});
```

## Full wiring example

```js
// src/app.js
require('express-async-errors');
const express = require('express');
const HttpError = require('./errors/HttpError');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.use('/api', require('./routes'));

// 404 — no route matched
app.use((req, res, next) => next(new HttpError(404, `Cannot ${req.method} ${req.originalUrl}`)));

// centralized error handler — MUST be last, MUST have 4 args
app.use(errorHandler);

module.exports = app;
```

---

### Checklist for this chapter

- [ ] `try / catch` in routes
- [ ] Passing errors with `next(err)`
- [ ] Error‑handling middleware (4 parameters)
- [ ] 404 Not Found handling
- [ ] Centralized error handler
- [ ] Sending proper status codes
- [ ] Custom error messages
- [ ] Handling async errors

**Next:** [7. Environment Variables & Config →](guide/07-environment-variables.md)
