# 4. Middleware

## What is middleware

**Middleware is a function that runs during the request/response cycle, in between receiving the request and sending the response.** Express processes a request by passing it through a *stack* of middleware functions in the order they were registered.

Each middleware can:

- Inspect or modify `req` and `res`.
- End the cycle by sending a response.
- Pass control to the next middleware with `next()`.

Route handlers are just the last middleware in the chain.

```
request ─▶ logger ─▶ express.json() ─▶ auth ─▶ route handler ─▶ response
```

## The `(req, res, next)` signature

```js
function myMiddleware(req, res, next) {
  // do something with req / res
  next(); // hand off to the next middleware
}
```

- **`req`** / **`res`** — same objects the route handler sees.
- **`next`** — a function. Call it to continue. Call `next(err)` to jump to error handling ([Chapter 6](guide/06-error-handling.md)).

If you neither send a response nor call `next()`, **the request hangs forever**.

## `app.use()`

`app.use()` registers middleware. Registration order = execution order.

```js
app.use(middlewareFn);              // runs for every request
app.use('/admin', middlewareFn);    // runs only for paths starting /admin
app.use('/api', router);            // mount a router (Chapter 5)
```

`app.use()` matches by **path prefix**; `app.get('/users')` matches the path exactly.

## Built‑in middleware

Express 4 ships only a few, all opt‑in:

| Middleware | Purpose |
|---|---|
| `express.json()` | Parse `application/json` bodies → `req.body` |
| `express.urlencoded({ extended: true })` | Parse HTML form bodies → `req.body` |
| `express.static(dir)` | Serve static files from a folder |
| `express.raw()` / `express.text()` | Parse raw / plain‑text bodies |

```js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

## `express.static()` for serving files

Serves files (HTML, CSS, images, downloads) directly from a directory.

```js
app.use(express.static('public'));
```

With a `public/` folder like:

```
public/
├── index.html
├── styles.css
└── logo.png
```

- `GET /` → `public/index.html`
- `GET /styles.css` → `public/styles.css`
- `GET /logo.png` → `public/logo.png`

Mount under a path prefix:

```js
app.use('/static', express.static('public'));
// GET /static/logo.png  → public/logo.png
```

Use an absolute path so it works regardless of where you launch node:

```js
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
```

## Custom middleware

### A request logger

```js
function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
}

app.use(logger);
```

### Attaching data to `req`

Middleware often adds computed values for later handlers:

```js
function attachRequestId(req, res, next) {
  req.id = require('crypto').randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}
app.use(attachRequestId);
```

### A configurable middleware (factory pattern)

```js
function requireApiKey(expectedKey) {
  return function (req, res, next) {
    if (req.get('X-API-Key') !== expectedKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
  };
}

app.use('/admin', requireApiKey(process.env.ADMIN_KEY));
```

## Middleware order matters

Middleware runs **top to bottom**. Consequences:

```js
// ✅ parser registered before routes that read req.body
app.use(express.json());
app.post('/books', (req, res) => res.json(req.body));

// ❌ parser after the route → req.body is undefined in that route
app.post('/books', (req, res) => res.json(req.body));
app.use(express.json());
```

```js
// ✅ logger first, so it logs everything
app.use(logger);
app.use('/api', apiRoutes);

// ❌ 404 handler before routes → everything 404s
app.use((req, res) => res.status(404).send('Not found'));
app.get('/books', handler); // never reached
```

**General order:** security/logging → body parsers → static files → routes → 404 handler → error handler (4‑arg, always last).

## `next()`

- `next()` — go to the next matching middleware/route.
- `next('route')` — skip the rest of the *current* route's handlers, go to the next matching route (only works inside `app.METHOD` handler chains).
- `next(err)` — skip all normal middleware, jump to the first error‑handling middleware.

```js
app.get('/report',
  (req, res, next) => {
    if (!req.query.ready) return next('route'); // bail to next /report route
    next();
  },
  (req, res) => res.send('full report')
);

app.get('/report', (req, res) => res.send('report not ready'));
```

## Skipping remaining middleware

Two ways to stop the chain early:

1. **Send a response** — don't call `next()`. The cycle ends.
   ```js
   function blockBots(req, res, next) {
     if (/bot/i.test(req.get('user-agent'))) {
       return res.status(403).json({ error: 'Bots not allowed' });
     }
     next();
   }
   ```
2. **Call `next(err)`** — jump straight to the error handler, skipping everything in between.

Always `return` after sending a response in a conditional, or code below it still runs.

## Application‑level vs router‑level middleware

| | Application‑level | Router‑level |
|---|---|---|
| Attached to | `app` | an `express.Router()` instance |
| Registered with | `app.use()` / `app.METHOD()` | `router.use()` / `router.METHOD()` |
| Scope | Whole app (or a mounted path) | Only requests that reach that router |

```js
// application-level
app.use(logger);

// router-level
const usersRouter = express.Router();
usersRouter.use((req, res, next) => {
  console.log('users router hit');
  next();
});
usersRouter.get('/', listUsers);
app.use('/users', usersRouter); // logger runs first, then the router middleware
```

More on routers in [Chapter 5](guide/05-routing-in-depth.md).

## Route‑specific middleware

Pass middleware as arguments before the handler — they run only for that route:

```js
app.post('/books', validateBody, requireAuth, (req, res) => {
  // only runs if validateBody and requireAuth both called next()
});

// or an array
app.get('/reports', [requireAuth, requireAdmin], handler);
```

## Third‑party middleware

Install from npm and `app.use()` it.

### `cors` — allow cross‑origin browser requests

```bash
npm install cors
```

```js
const cors = require('cors');

app.use(cors());                       // allow all origins
app.use(cors({
  origin: 'https://myfrontend.com',    // allow one origin
  methods: ['GET', 'POST'],
  credentials: true,                   // allow cookies
}));
```

Needed when a browser app on a different origin (domain/port) calls your API.

### `morgan` — HTTP request logging

```bash
npm install morgan
```

```js
const morgan = require('morgan');

app.use(morgan('dev'));      // colored concise output for development
app.use(morgan('combined')); // Apache-style logs for production
```

### Other common ones

| Package | Purpose |
|---|---|
| `helmet` | Sets security‑related HTTP headers |
| `express-rate-limit` | Throttle requests per IP |
| `compression` | gzip responses |
| `cookie-parser` | Parse the `Cookie` header → `req.cookies` |
| `express-session` | Server‑side sessions |
| `multer` | Handle `multipart/form-data` file uploads |

### Typical production stack

```js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

app.use('/api', require('./routes'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

module.exports = app;
```

---

### Checklist for this chapter

- [ ] What is middleware
- [ ] The `(req, res, next)` signature
- [ ] `app.use()`
- [ ] Built‑in middleware (`express.json`, `express.static`)
- [ ] `express.static()` for serving files
- [ ] Custom middleware
- [ ] Middleware order matters
- [ ] `next()`
- [ ] Skipping remaining middleware
- [ ] Application‑level vs router‑level middleware
- [ ] Third‑party middleware (`cors`, `morgan`)

**Next:** [5. Routing in Depth →](guide/05-routing-in-depth.md)
