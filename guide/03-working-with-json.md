# 3. Working with JSON

## Why JSON is needed

HTTP moves **text**. JSON (JavaScript Object Notation) is the standard text format for sending structured data between a client and an API:

- Language‑neutral — every platform can produce/consume it.
- Maps cleanly to JS objects and arrays.
- Human‑readable and compact.

A JSON request body looks like this on the wire:

```
POST /books HTTP/1.1
Content-Type: application/json
Content-Length: 34

{"title":"Refactoring","year":1999}
```

Your job in Express: turn that raw text into `req.body` (an object), and turn your objects back into JSON responses.

## `express.json()` middleware

Express does **not** parse request bodies by default. `express.json()` is built‑in middleware that:

1. Checks the `Content-Type` is `application/json`.
2. Reads the raw request stream.
3. `JSON.parse()`s it.
4. Assigns the result to `req.body`.

```js
const express = require('express');
const app = express();

app.use(express.json()); // register ONCE, before your routes
```

Options you may set:

```js
app.use(express.json({
  limit: '1mb',          // reject bodies larger than this (default 100kb)
  strict: true,          // only accept arrays/objects at the top level
}));
```

If you also need to read HTML form submissions (`application/x-www-form-urlencoded`):

```js
app.use(express.urlencoded({ extended: true }));
```

## Reading a JSON body — `req.body`

```js
app.post('/books', (req, res) => {
  console.log(req.body);            // { title: 'Refactoring', year: 1999 }
  const { title, year } = req.body; // destructure what you need
  res.status(201).json({ title, year });
});
```

Without `app.use(express.json())`, `req.body` is `undefined` and destructuring it throws `Cannot destructure property ... of 'undefined'`.

## Sending JSON responses — `res.json()`

```js
res.json({ id: 1, title: 'Clean Code' });
res.json([{ id: 1 }, { id: 2 }]);
res.status(201).json({ created: true });
```

`res.json()`:

- Serializes the value with `JSON.stringify()`.
- Sets `Content-Type: application/json; charset=utf-8`.
- Sends the response.

`res.send(obj)` does *almost* the same thing for objects, but `res.json()` is explicit and also serializes values like `null` correctly. **For APIs, always use `res.json()`.**

## Content‑Type header

The `Content-Type` header tells the other side how to interpret the body.

- **Client → server:** you must send `Content-Type: application/json` or `express.json()` skips parsing and `req.body` stays `{}` (or undefined).
  ```bash
  curl -X POST http://localhost:3000/books \
    -H "Content-Type: application/json" \
    -d '{"title":"Refactoring"}'
  ```
- **Server → client:** `res.json()` sets it for you. To set headers manually:
  ```js
  res.set('Content-Type', 'application/json');
  res.type('json'); // shorthand
  ```

Read a request header with `req.get('Content-Type')` or `req.headers['content-type']`.

## Handling missing / invalid JSON

If the body is malformed (`{"title": }`), `express.json()` throws a `SyntaxError` and forwards it to your error handler. Add one **after** your routes:

```js
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});
```

Handle the "no body at all" case in the route itself:

```js
app.post('/books', (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body is required' });
  }
  // ...
});
```

## Validating required fields

Do validation **before** touching your data store. Collect all problems, then respond once with `400`.

```js
function validateBook(body) {
  const errors = [];
  if (!body.title || typeof body.title !== 'string') {
    errors.push('title is required and must be a string');
  }
  if (body.year !== undefined && !Number.isInteger(body.year)) {
    errors.push('year must be an integer');
  }
  if (body.year !== undefined && (body.year < 0 || body.year > 2100)) {
    errors.push('year is out of range');
  }
  return errors;
}

app.post('/books', (req, res) => {
  const errors = validateBook(req.body);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const book = { id: nextId++, title: req.body.title.trim(), year: req.body.year ?? null };
  books.push(book);
  res.status(201).json(book);
});
```

As projects grow, replace hand‑rolled checks with a schema library — [zod](https://zod.dev/), [joi](https://joi.dev/), or [express-validator](https://express-validator.github.io/):

```js
const { z } = require('zod');

const bookSchema = z.object({
  title: z.string().min(1),
  year: z.number().int().min(0).max(2100).optional(),
});

app.post('/books', (req, res) => {
  const result = bookSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  const book = { id: nextId++, ...result.data };
  books.push(book);
  res.status(201).json(book);
});
```

## Common body‑parsing errors

| Symptom | Cause | Fix |
|---|---|---|
| `req.body` is `undefined` | `express.json()` not registered | `app.use(express.json())` before routes |
| `req.body` is `{}` despite sending data | Missing/wrong `Content-Type` header | Send `Content-Type: application/json` |
| `Cannot destructure property 'x' of 'req.body' as it is undefined` | Same as above | Register parser; guard with `req.body ?? {}` |
| `SyntaxError: Unexpected token ... in JSON` | Malformed JSON (trailing comma, single quotes, unquoted keys) | Fix the client payload; add a `400` error handler |
| `PayloadTooLargeError` | Body exceeds the limit | Raise `limit` in `express.json({ limit: '5mb' })` or reject legitimately |
| Body works in Postman, not from a browser `fetch` | `fetch` sends `text/plain` unless told otherwise | `headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)` |

A correct browser `fetch`:

```js
await fetch('/books', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Refactoring', year: 1999 }),
});
```

---

### Checklist for this chapter

- [ ] Why JSON is needed
- [ ] `express.json()` middleware
- [ ] Reading a JSON body (`req.body`)
- [ ] Sending JSON responses (`res.json()`)
- [ ] Content‑Type header
- [ ] Handling missing / invalid JSON
- [ ] Validating required fields
- [ ] Common body‑parsing errors

**Next:** [4. Middleware →](guide/04-middleware.md)
