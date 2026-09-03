# Step 3 — JSON & Middleware

Our task routes (next step) will receive JSON bodies (`{"title": "Buy milk"}`) and return JSON. For that we need to understand **middleware** — the pipeline every request flows through — and turn on the built‑in **JSON body parser**.

## What is middleware?

**Middleware is a function that runs on a request before (or instead of) the route handler.** Express processes each request by passing it through a **stack** of these functions, in the order you registered them.

```
request ──▶ logger ──▶ express.json() ──▶ (route handler) ──▶ response
```

Each middleware gets `(req, res, next)` and can:

1. Run code (log, parse, check auth).
2. Change `req` or `res`.
3. **End the request** by sending a response, **or**
4. **Pass control on** by calling `next()`.

If a middleware neither sends a response nor calls `next()`, the request **hangs forever**.

## The `(req, res, next)` signature

```js
function example(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next();               // hand off to the next middleware / the route
}
```

- `req`, `res` — the same objects the route handler will get.
- `next` — a function. `next()` continues the chain. `next(err)` jumps straight to the error handler (Step 5).

A route handler is really just the **last** middleware in the chain — the one that sends the response.

## `app.use()` — register middleware

```js
app.use(fn);              // runs for EVERY request
app.use('/api', fn);      // runs only for requests whose path starts with /api
app.use('/api', router);  // mount a whole router (Step 4)
```

Registration order = execution order. This matters — see below.

## Turn on JSON parsing — `express.json()`

By default `req.body` is `undefined`. `express.json()` is **built‑in middleware** that:

1. Checks the request's `Content-Type` is `application/json`.
2. Reads the raw request stream.
3. `JSON.parse()`s it.
4. Puts the result on `req.body`.

```js
// src/app.js
const express = require('express');

const app = express();

app.use(express.json());     // <-- register ONCE, before the routes

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
```

Now a route can read `req.body`:

```js
app.post('/echo', (req, res) => {
  res.json({ youSent: req.body });
});
```

```bash
curl -X POST http://localhost:3000/echo \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'
# {"youSent":{"title":"Buy milk"}}
```

Leave off `-H "Content-Type: application/json"` and `express.json()` skips parsing — `req.body` comes back as `{}`.

## Sending JSON — `res.json()`

```js
res.json({ id: 1, title: 'Buy milk' });   // an object
res.json([{ id: 1 }, { id: 2 }]);          // an array
res.status(201).json({ created: true });   // with a status code
```

`res.json()`:

- serializes with `JSON.stringify()`,
- sets `Content-Type: application/json; charset=utf-8`,
- sends the response.

For our API we use `res.json()` everywhere (not `res.send()`) — it's explicit and handles values like `null` correctly.

## The Content‑Type header

- **Client → server:** must send `Content-Type: application/json` or the body isn't parsed.
- **Server → client:** `res.json()` sets it automatically.
- Read a request header with `req.get('Content-Type')`.

A correct browser `fetch` (for reference):

```js
await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Buy milk' }),
});
```

## Middleware order matters

Middleware runs top to bottom. Consequences:

```js
// ✅ parser BEFORE routes → req.body is populated
app.use(express.json());
app.post('/tasks', (req, res) => res.json(req.body));

// ❌ parser AFTER the route → req.body is undefined in that route
app.post('/tasks', (req, res) => res.json(req.body));
app.use(express.json());
```

General order for our app:

```
1. logging          (morgan)
2. cors             (if a browser frontend calls us)
3. express.json()   (body parsing)
4. routes           (/health, /api/...)
5. 404 handler      (Step 5)
6. error handler    (Step 5 — always last, 4 arguments)
```

## Add a request logger with `morgan`

`morgan` is **third‑party middleware** that logs every HTTP request — method, path, status, response time.

```bash
npm install morgan
```

```js
// src/app.js
const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(morgan('dev'));       // we make this environment-aware in Step 6
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
```

Now every request prints:

```
GET /health 200 4.021 ms - 15
POST /echo 200 1.113 ms - 31
```

`'dev'` is concise and colour‑coded for local work; `'combined'` is the verbose Apache format for production logs — we'll switch on `NODE_ENV` in Step 6.

## Add `cors` (if a browser app will call this API)

A browser refuses cross‑origin requests unless the server opts in with CORS headers. `cors` is third‑party middleware that adds them.

```bash
npm install cors
```

```js
const cors = require('cors');

app.use(cors());                              // allow any origin (fine for dev)
// or lock it down:
app.use(cors({ origin: 'https://my-frontend.com', credentials: true }));
```

If your API is only ever called by `curl` / Postman / another server, you don't need `cors` — but it's harmless to include.

## Custom middleware (we'll write a real one in Step 11)

You can write your own. Example — attach a request id to every request:

```js
const { randomUUID } = require('crypto');

app.use((req, res, next) => {
  req.id = randomUUID();
  res.set('X-Request-Id', req.id);
  next();
});
```

In Step 11 we write `requireAuth` — a custom middleware that checks the JWT and either attaches `req.user` and calls `next()`, or responds `401` and stops the chain.

## Built‑in vs third‑party vs custom

| Kind | Examples | How you get it |
|---|---|---|
| **Built‑in** | `express.json()`, `express.urlencoded()`, `express.static()` | Ships with Express |
| **Third‑party** | `morgan`, `cors`, `helmet` | `npm install` |
| **Custom** | your `requireAuth`, loggers, validators | you write it |

## `express.static()` — serving files (aside)

If you ever need to serve HTML/CSS/images, `express.static('public')` serves a folder directly:

```js
app.use(express.static('public'));   // GET /logo.png → public/logo.png
```

Our Task Manager is a pure JSON API, so we don't use it — but it's the built‑in middleware for static files.

## Current `src/app.js`

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

module.exports = app;
```

## Where we are

Request pipeline is set up: logging → JSON parsing → routes. Now we build the actual Tasks CRUD — kept in memory for now.

---

**Concepts introduced here:** what middleware is · the `(req, res, next)` signature · `app.use()` · built‑in middleware · `express.json()` and `req.body` · `res.json()` · Content‑Type header · middleware order · third‑party middleware (`morgan`, `cors`) · built‑in vs third‑party vs custom · `express.static()`

**Next:** [Step 4 — In‑Memory Tasks CRUD →](/guide/04-tasks-crud-in-memory.md)
