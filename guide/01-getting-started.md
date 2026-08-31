# 1. Getting Started with Express

## What is Express.js

Express is a **minimal, unopinionated web framework for Node.js**. It sits on top of Node's built‑in `http` module and gives you a clean API for:

- **Routing** — map an HTTP method + URL path to a function.
- **Middleware** — run functions in sequence on every request (parsing, logging, auth…).
- **Request/response helpers** — `res.json()`, `res.status()`, `req.params`, etc.

Express does *not* force a folder structure, a database, or a templating engine on you. You assemble the pieces you need.

## Express vs the plain `http` module

With the raw `http` module you handle everything manually:

```js
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Home');
  } else if (req.method === 'GET' && req.url === '/about') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('About');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000);
```

The same thing in Express:

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Home'));
app.get('/about', (req, res) => res.send('About'));

app.listen(3000);
```

| Plain `http` | Express |
|---|---|
| Manual `if` checks on `req.method` / `req.url` | Declarative `app.get()`, `app.post()`, … |
| Manual header + status writing | `res.send()`, `res.json()`, `res.status()` |
| No body parsing | `express.json()` middleware |
| No route params | `/users/:id` → `req.params.id` |
| You build the middleware concept yourself | Built in |

Express *is* still using `http` underneath — `app` is a request handler you could pass to `http.createServer(app)`.

## Installing Express

```bash
npm init -y            # creates package.json
npm install express    # adds express to dependencies
```

Check `package.json`:

```json
{
  "dependencies": {
    "express": "^4.19.2"
  }
}
```

> Commit `package.json` and `package-lock.json`. Do **not** commit `node_modules/` — add it to `.gitignore`.

## Creating an Express app — `express()`

```js
const express = require('express');
const app = express();
```

`express()` returns an **application object**. Everything you configure — routes, middleware, settings — hangs off `app`.

## `app.listen()`

`app.listen(port, callback)` starts the HTTP server and begins accepting connections.

```js
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

The callback is optional but useful for a "server is up" log line.

## Choosing a port

- **3000** is the community convention for local Express dev.
- In production the port usually comes from the environment: `process.env.PORT`.
- Ports below 1024 (like 80/443) need elevated privileges — avoid them locally.

```js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
```

If you see `EADDRINUSE`, another process already holds that port — stop it or pick another.

## Testing that the server is running

- **Browser** — visit `http://localhost:3000` for `GET` routes.
- **curl**:
  ```bash
  curl http://localhost:3000
  curl -i http://localhost:3000        # -i shows status line + headers
  ```
- **Postman / Insomnia / REST Client** — needed for `POST`, `PUT`, `DELETE` and sending JSON bodies.

## Basic routing

A route = **HTTP method** + **path** + **handler**.

```js
app.get('/items', (req, res) => res.send('list items'));
app.post('/items', (req, res) => res.send('create item'));
app.put('/items/:id', (req, res) => res.send('replace item'));
app.patch('/items/:id', (req, res) => res.send('update item'));
app.delete('/items/:id', (req, res) => res.send('delete item'));
```

| Method | Purpose |
|---|---|
| `GET` | Read data (no body, safe, idempotent) |
| `POST` | Create a new resource |
| `PUT` | Replace a resource entirely |
| `PATCH` | Partially update a resource |
| `DELETE` | Remove a resource |

## Route handler signature — `(req, res)`

Every handler receives:

- **`req`** — the incoming request: `req.params`, `req.query`, `req.body`, `req.headers`, `req.method`, `req.path`.
- **`res`** — the response you build: `res.send()`, `res.json()`, `res.status()`, `res.set()`.

A third argument, **`next`**, is used by middleware and error handlers (Chapters 4 & 6).

```js
app.get('/hello/:name', (req, res) => {
  const name = req.params.name;
  res.send(`Hello, ${name}`);
});
```

## Sending a response — `res.send()`

`res.send()` is the general‑purpose responder. It sets a sensible `Content-Type` based on what you pass:

```js
res.send('plain text');              // text/html
res.send('<h1>HTML</h1>');           // text/html
res.send({ ok: true });              // application/json (object → JSON)
res.send([1, 2, 3]);                 // application/json
```

You must send **exactly one** response per request. Calling `res.send()` twice throws `ERR_HTTP_HEADERS_SENT`.

For APIs, prefer the explicit `res.json()` (Chapter 3).

## `res.status()`

Sets the HTTP status code. It's **chainable** — it returns `res`, so you follow it with `.send()` or `.json()`:

```js
res.status(201).json({ id: 1, name: 'New item' });   // Created
res.status(404).send('Not found');
res.status(204).end();                                // No Content (no body)
```

Default is `200` if you never call `res.status()`.

Common codes you'll use constantly:

| Code | Meaning | Typical use |
|---|---|---|
| 200 | OK | Successful GET / PUT / PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE with no body |
| 400 | Bad Request | Validation failed / bad JSON |
| 401 | Unauthorized | Missing or invalid credentials |
| 403 | Forbidden | Authenticated but not allowed |
| 404 | Not Found | Resource / route doesn't exist |
| 500 | Internal Server Error | Unhandled exception |

## `nodemon` for development

`nodemon` watches your files and restarts Node automatically when you save.

```bash
npm install --save-dev nodemon
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

```bash
npm run dev
```

- `npm start` — plain node, for production.
- `npm run dev` — nodemon, for local development.

## Restarting automatically on file changes

That's exactly what `nodemon` does. On every save it kills the process and re‑runs it. You can also type `rs` + Enter in the terminal to force a restart, and configure it with a `nodemon.json`:

```json
{
  "watch": ["src", "index.js"],
  "ext": "js,json",
  "ignore": ["*.test.js"]
}
```

## Basic project folder structure

Start flat, split as it grows:

```
express-practice/
├── node_modules/        # installed packages (gitignored)
├── src/
│   ├── app.js           # create app, wire middleware + routes (no listen)
│   ├── server.js        # import app, call app.listen()
│   ├── routes/
│   │   └── items.routes.js
│   ├── controllers/
│   │   └── items.controller.js
│   ├── middleware/
│   │   └── logger.js
│   └── data/
│       └── items.js     # in-memory store for now
├── .env                 # secrets / config (gitignored)
├── .gitignore
├── package.json
└── package-lock.json
```

Splitting `app.js` (configuration) from `server.js` (starting the server) makes the app importable in tests without opening a port.

```js
// src/app.js
const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
module.exports = app;
```

```js
// src/server.js
const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
```

---

### Checklist for this chapter

- [ ] What is Express.js
- [ ] Express vs the plain http module
- [ ] Installing Express (`npm install express`)
- [ ] Creating an Express app (`express()`)
- [ ] `app.listen()`
- [ ] Choosing a port
- [ ] Testing the server is running
- [ ] Basic routing (`app.get`, `app.post`, `app.put`, `app.delete`)
- [ ] Route handler signature `(req, res)`
- [ ] Sending a response (`res.send()`)
- [ ] `res.status()`
- [ ] nodemon for development
- [ ] Restarting automatically on file changes
- [ ] Basic project folder structure

**Next:** [2. Basic CRUD →](guide/02-basic-crud.md)
