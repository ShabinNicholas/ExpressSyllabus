# Step 2 — Your First Server

Goal: a running server that responds to a request. Along the way we meet the Express **app object**, **routing**, the **`(req, res)`** handler, `res.send()` / `res.status()`, and **nodemon**.

## Create the Express app — `src/app.js`

```js
// src/app.js
const express = require('express');

const app = express();

// a first route so we can see something
app.get('/', (req, res) => {
  res.send('Task Manager API is running');
});

module.exports = app;
```

- `require('express')` imports the library.
- `express()` **calls it** and returns an **application object** — conventionally named `app`. Every route and every piece of middleware attaches to `app`.
- We `module.exports = app` so `server.js` can start it.

## Start the server — `src/server.js`

```js
// src/server.js
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
```

- **`app.listen(port, callback)`** binds to the port and starts accepting connections. The callback runs once, when the server is ready — a good place for a "server up" log.
- **Choosing a port:** `3000` is the community default for local Express dev. In production the hosting platform passes one in `process.env.PORT`, so we read that first and fall back to `3000`. We'll formalise this in Step 6.

## Run it

```bash
npm run dev
```

You should see:

```
Server listening on http://localhost:3000
```

## Test that it works

**In a browser:** open <http://localhost:3000> → *Task Manager API is running*.

**With curl:**

```bash
curl http://localhost:3000
# Task Manager API is running

curl -i http://localhost:3000
# -i also prints the status line and headers:
# HTTP/1.1 200 OK
# Content-Type: text/html; charset=utf-8
# ...
```

## nodemon — automatic restarts

You started with `npm run dev`, which runs `nodemon src/server.js`. nodemon watches your files; **every time you save**, it kills Node and restarts it. Try it: change the string in `app.js` to `'Hello from Task Manager'`, save, and refresh — no manual restart.

You can force a restart by typing `rs` + Enter in the terminal.

> With plain `npm start` (`node src/server.js`) you'd have to stop (`Ctrl+C`) and re‑run after every change. Use `npm run dev` while building.

## Understanding routing

A **route** is three things: an **HTTP method** + a **URL path** + a **handler function**.

```js
app.get('/tasks', handler);      // GET    /tasks
app.post('/tasks', handler);     // POST   /tasks
app.put('/tasks/:id', handler);  // PUT    /tasks/:id
app.patch('/tasks/:id', handler);// PATCH  /tasks/:id
app.delete('/tasks/:id', handler);// DELETE /tasks/:id
```

| Method | Meaning in a REST API |
|---|---|
| `GET` | Read data. No body. |
| `POST` | Create a new resource. |
| `PUT` | Replace a resource entirely. |
| `PATCH` | Update part of a resource. |
| `DELETE` | Remove a resource. |

We'll build all of these for `/tasks` in Step 4.

## The `(req, res)` handler

Every route handler is called with two objects:

```js
app.get('/hello/:name', (req, res) => {
  //  req  = the incoming request
  //  res  = the response you build and send
  res.send(`Hello, ${req.params.name}`);
});
```

- **`req`** — everything about the request: `req.params` (path params), `req.query` (`?key=value`), `req.body` (parsed JSON — Step 3), `req.headers`, `req.method`, `req.path`.
- **`res`** — how you reply: `res.send()`, `res.json()`, `res.status()`, `res.set()`.

There is a **third** parameter, `next`, used by middleware and error handlers — we meet it in Step 3 and Step 5.

You must send **exactly one** response per request. Calling `res.send()` twice throws `ERR_HTTP_HEADERS_SENT`.

## `res.send()` vs `res.status()`

**`res.send()`** — general purpose. It guesses the `Content-Type` from what you pass:

```js
res.send('text');            // text/html
res.send('<h1>hi</h1>');     // text/html
res.send({ ok: true });      // application/json
```

**`res.status(code)`** — sets the HTTP status code. It returns `res`, so you **chain** it:

```js
res.status(201).send('Created');
res.status(404).send('Not found');
res.status(204).end();       // 204 = No Content, no body
```

If you never call `res.status()`, the response is `200`.

For our API we'll almost always use **`res.json()`** (Step 3) instead of `res.send()`, because we're returning structured data.

## Add a health check

Replace the placeholder route with something we'll actually keep. A `/health` endpoint is standard — hosting platforms ping it to know the app is alive.

```js
// src/app.js
const express = require('express');

const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app;
```

```bash
curl -i http://localhost:3000/health
# HTTP/1.1 200 OK
# Content-Type: application/json; charset=utf-8
#
# {"status":"ok"}
```

In Step 7 we'll extend `/health` to also check the database connection.

## Where we are

```
src/
├── app.js      ✅ creates the app, has /health
└── server.js   ✅ starts it on a port
```

Server runs, responds to `GET /health`. Next we learn about middleware and turn on JSON parsing, so our routes can read and send JSON.

---

**Concepts introduced here:** `express()` app object · `app.listen()` · choosing a port · basic routing (`app.get/post/put/patch/delete`) · the `(req, res)` handler · `res.send()` · `res.status()` · nodemon auto‑restart · testing with curl

**Next:** [Step 3 — JSON & Middleware →](/guide/03-json-and-middleware.md)
