# 2. Basic CRUD (in‑memory, no JSON file)

We'll build a full **C**reate/**R**ead/**U**pdate/**D**elete API for a `books` resource, storing everything in a plain array in memory. No database, no JSON file — just enough to learn the shape of a REST API.

> **In‑memory means data is lost on restart.** That's fine for learning. Chapters 7 & 9 move toward persistence.

## Storing data in an in‑memory array

```js
// src/data/books.js
let books = [
  { id: 1, title: 'The Pragmatic Programmer', year: 1999 },
  { id: 2, title: 'Clean Code', year: 2008 },
];

module.exports = books;
```

Because `books` is a module‑level array, every route file that `require`s it shares the same data for the life of the process.

## The full example app

```js
// index.js
const express = require('express');
const app = express();
app.use(express.json()); // needed for POST/PUT/PATCH bodies — see Chapter 3

let books = [
  { id: 1, title: 'The Pragmatic Programmer', year: 1999 },
  { id: 2, title: 'Clean Code', year: 2008 },
];
let nextId = 3;

// ... routes below ...

app.listen(3000, () => console.log('http://localhost:3000'));
```

## GET all items

```js
app.get('/books', (req, res) => {
  res.status(200).json(books);
});
```

```bash
curl http://localhost:3000/books
```

Return an **array**, even when it's empty (`[]`) — not `404`. "No books yet" is a successful, valid response.

## GET a single item by id

```js
app.get('/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: `Book ${id} not found` });
  }
  res.status(200).json(book);
});
```

```bash
curl http://localhost:3000/books/1
curl -i http://localhost:3000/books/999   # 404
```

## Route parameters — `req.params`

Anything in the path prefixed with `:` becomes a key on `req.params`. **Params are always strings** — convert as needed.

```js
app.get('/books/:id', (req, res) => {
  console.log(req.params);        // { id: '1' }
  const id = Number(req.params.id); // 1
});
```

Multiple params:

```js
app.get('/authors/:authorId/books/:bookId', (req, res) => {
  const { authorId, bookId } = req.params;
  res.json({ authorId, bookId });
});
```

## Query parameters — `req.query`

Query strings (`?key=value&key2=value2`) land on `req.query`. Use them for **filtering, sorting, pagination, search** — optional modifiers, not identifiers.

```js
// GET /books?year=2008&sort=title&limit=10
app.get('/books', (req, res) => {
  let result = [...books];

  if (req.query.year) {
    result = result.filter((b) => b.year === Number(req.query.year));
  }
  if (req.query.sort === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (req.query.limit) {
    result = result.slice(0, Number(req.query.limit));
  }

  res.json(result);
});
```

```bash
curl "http://localhost:3000/books?year=2008"
curl "http://localhost:3000/books?sort=title&limit=1"
```

| | `req.params` | `req.query` |
|---|---|---|
| Comes from | The path (`/books/:id`) | The `?...` string |
| Used for | Identifying a resource | Filtering / options |
| Required? | Yes (part of route) | Usually optional |

## POST — create an item

```js
app.post('/books', (req, res) => {
  const { title, year } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const book = { id: nextId++, title, year: year ?? null };
  books.push(book);

  res.status(201).json(book); // 201 Created + return the created resource
});
```

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Refactoring","year":1999}'
```

Return **`201`** and the newly created object (so the client gets the generated `id`). Some APIs also set a `Location` header: `res.location(`/books/${book.id}`)`.

## Generating a new id

For in‑memory learning apps, any of these work:

```js
// 1. A running counter (simplest, predictable)
let nextId = 1;
const id = nextId++;

// 2. Max existing id + 1  (survives deletes better than length+1)
const id = books.length ? Math.max(...books.map((b) => b.id)) + 1 : 1;

// 3. A real unique id (closest to what a DB gives you)
const { randomUUID } = require('crypto');
const id = randomUUID(); // "3f2504e0-4f89-11d3-9a0c-0305e82c3301"
```

Avoid `books.length + 1` — after a delete it can collide with an existing id.

## PUT — update (replace) an item

`PUT` replaces the whole resource. The client sends the complete new representation.

```js
app.put('/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = books.findIndex((b) => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Book ${id} not found` });
  }
  const { title, year } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  books[index] = { id, title, year: year ?? null }; // full replacement, keep id
  res.status(200).json(books[index]);
});
```

## PATCH vs PUT (light)

- **PUT** — send the *entire* object; missing fields get reset/removed. Idempotent.
- **PATCH** — send *only the fields that change*; everything else stays.

```js
app.patch('/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: `Book ${id} not found` });
  }

  // merge only the provided keys
  if (req.body.title !== undefined) book.title = req.body.title;
  if (req.body.year !== undefined) book.year = req.body.year;

  res.status(200).json(book);
});
```

```bash
# PATCH: change only the year
curl -X PATCH http://localhost:3000/books/1 \
  -H "Content-Type: application/json" \
  -d '{"year":2019}'
```

Rule of thumb while learning: implement `PATCH` for partial edits; `PUT` is optional.

## DELETE — remove an item

```js
app.delete('/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = books.findIndex((b) => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Book ${id} not found` });
  }

  const [removed] = books.splice(index, 1);
  res.status(200).json(removed); // or: res.status(204).end();
});
```

```bash
curl -X DELETE http://localhost:3000/books/1
```

Two valid styles:

- `200` + the deleted object (handy for the client).
- `204 No Content` + empty body (`res.status(204).end()`).

## Handling "not found" cases

Every route that takes an `:id` must handle a missing record. The pattern:

```js
const book = books.find((b) => b.id === Number(req.params.id));
if (!book) return res.status(404).json({ error: 'Book not found' });
```

Use an early `return` so the rest of the handler doesn't run. Also add a catch‑all for unknown *routes* (covered in [Chapter 6](guide/06-error-handling.md)):

```js
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});
```

## Returning the right status code per operation

| Operation | Success | Common failures |
|---|---|---|
| `GET /books` | `200` + array | — |
| `GET /books/:id` | `200` + object | `404` not found |
| `POST /books` | `201` + created object | `400` validation |
| `PUT /books/:id` | `200` + updated object | `400` validation, `404` not found |
| `PATCH /books/:id` | `200` + updated object | `400` validation, `404` not found |
| `DELETE /books/:id` | `200` + object *or* `204` | `404` not found |

## Complete reference implementation

```js
const express = require('express');
const app = express();
app.use(express.json());

let books = [
  { id: 1, title: 'The Pragmatic Programmer', year: 1999 },
  { id: 2, title: 'Clean Code', year: 2008 },
];
let nextId = 3;

const findBook = (req) => books.find((b) => b.id === Number(req.params.id));

app.get('/books', (req, res) => {
  let result = [...books];
  if (req.query.year) result = result.filter((b) => b.year === Number(req.query.year));
  if (req.query.limit) result = result.slice(0, Number(req.query.limit));
  res.json(result);
});

app.get('/books/:id', (req, res) => {
  const book = findBook(req);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

app.post('/books', (req, res) => {
  const { title, year } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const book = { id: nextId++, title, year: year ?? null };
  books.push(book);
  res.status(201).json(book);
});

app.put('/books/:id', (req, res) => {
  const book = findBook(req);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (!req.body.title) return res.status(400).json({ error: 'title is required' });
  book.title = req.body.title;
  book.year = req.body.year ?? null;
  res.json(book);
});

app.patch('/books/:id', (req, res) => {
  const book = findBook(req);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (req.body.title !== undefined) book.title = req.body.title;
  if (req.body.year !== undefined) book.year = req.body.year;
  res.json(book);
});

app.delete('/books/:id', (req, res) => {
  const index = books.findIndex((b) => b.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Book not found' });
  const [removed] = books.splice(index, 1);
  res.json(removed);
});

app.listen(3000, () => console.log('http://localhost:3000'));
```

---

### Checklist for this chapter

- [ ] Storing data in an in‑memory array
- [ ] GET all items
- [ ] GET a single item by id
- [ ] Route parameters (`req.params`)
- [ ] Query parameters (`req.query`)
- [ ] POST create an item
- [ ] Generating a new id
- [ ] PUT update an item
- [ ] PATCH vs PUT (light)
- [ ] DELETE remove an item
- [ ] Handling "not found" cases
- [ ] Returning the right status code per operation

**Next:** [3. Working with JSON →](guide/03-working-with-json.md)
