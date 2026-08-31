# 5. Routing in Depth

As an app grows, keeping every route in `index.js` becomes unmanageable. `express.Router()` lets you break routes into small, focused modules and mount them under a base path.

## `express.Router()`

A **router** is a mini Express application: it has its own `.get()`, `.post()`, `.use()`, `.route()`, and its own middleware stack. It has no `.listen()` — you mount it onto an app (or another router).

```js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.send('all books'));
router.get('/:id', (req, res) => res.send(`book ${req.params.id}`));

module.exports = router;
```

## Splitting routes into separate files

A conventional layout:

```
src/
├── app.js
├── routes/
│   ├── index.js          # combines all routers
│   ├── books.routes.js
│   └── users.routes.js
└── controllers/
    ├── books.controller.js
    └── users.controller.js
```

**Controller** — the logic for one endpoint:

```js
// src/controllers/books.controller.js
let books = [{ id: 1, title: 'Clean Code' }];
let nextId = 2;

exports.list = (req, res) => res.json(books);

exports.get = (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: 'Not found' });
  res.json(book);
};

exports.create = (req, res) => {
  if (!req.body.title) return res.status(400).json({ error: 'title required' });
  const book = { id: nextId++, title: req.body.title };
  books.push(book);
  res.status(201).json(book);
};

exports.remove = (req, res) => {
  const i = books.findIndex((b) => b.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  res.json(books.splice(i, 1)[0]);
};
```

**Router** — wires paths to controller functions:

```js
// src/routes/books.routes.js
const router = require('express').Router();
const books = require('../controllers/books.controller');

router.get('/', books.list);
router.post('/', books.create);
router.get('/:id', books.get);
router.delete('/:id', books.remove);

module.exports = router;
```

**Combine routers** in one place:

```js
// src/routes/index.js
const router = require('express').Router();

router.use('/books', require('./books.routes'));
router.use('/users', require('./users.routes'));

module.exports = router;
```

## Mounting a router with `app.use()`

```js
// src/app.js
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api', require('./routes'));   // everything lives under /api

module.exports = app;
```

Resulting endpoints:

| Method + Path | Handler |
|---|---|
| `GET /api/books` | `books.list` |
| `POST /api/books` | `books.create` |
| `GET /api/books/:id` | `books.get` |
| `DELETE /api/books/:id` | `books.remove` |

Paths inside a router are **relative to where it's mounted**. `router.get('/')` mounted at `/api/books` responds to `/api/books`.

## Route‑level middleware

Middleware can be scoped to a whole router, a group of routes, or a single route.

```js
const router = require('express').Router();

// runs for every route in THIS router
router.use((req, res, next) => {
  console.log('books router:', req.method, req.originalUrl);
  next();
});

// runs only when :id is present in the path
router.param('id', (req, res, next, id) => {
  req.bookId = Number(id);
  next();
});

// runs only for this one route (after the router-level middleware above)
router.post('/', validateBook, books.create);

module.exports = router;
```

`router.param('id', ...)` is a handy hook: it runs once whenever a route in that router has an `:id` parameter — good for loading the record and 404‑ing in one place.

## Route parameters with multiple segments

```js
// two params
router.get('/:authorId/books/:bookId', (req, res) => {
  const { authorId, bookId } = req.params;
  res.json({ authorId, bookId });
});

// optional param (note the ?)
router.get('/:year/:month?', (req, res) => {
  res.json({ year: req.params.year, month: req.params.month ?? 'all' });
});

// param with a regex constraint — id must be digits
router.get('/:id(\\d+)', (req, res) => {
  res.json({ id: Number(req.params.id) });
});

// wildcard — capture the rest of the path
router.get('/files/*', (req, res) => {
  res.json({ path: req.params[0] }); // everything after /files/
});
```

## Chaining route methods — `app.route()` / `router.route()`

When several HTTP methods share the same path, `.route()` removes repetition:

```js
router
  .route('/:id')
  .get(books.get)
  .put(books.replace)
  .patch(books.update)
  .delete(books.remove);
```

Equivalent to writing `router.get('/:id', ...)`, `router.put('/:id', ...)`, etc. separately.

You can also chain at the app level:

```js
app.route('/books')
  .get(books.list)
  .post(books.create);
```

## Nested routers

A router can be mounted inside another router — useful for resources that belong to a parent (`/users/:userId/posts`).

```js
// src/routes/posts.routes.js
const router = require('express').Router({ mergeParams: true }); // <-- important

router.get('/', (req, res) => {
  // req.params.userId is available thanks to mergeParams
  res.json({ userId: req.params.userId, posts: [] });
});

module.exports = router;
```

```js
// src/routes/users.routes.js
const router = require('express').Router();
const users = require('../controllers/users.controller');

router.get('/:userId', users.get);

// mount the posts router under /:userId/posts
router.use('/:userId/posts', require('./posts.routes'));

module.exports = router;
```

```js
// src/routes/index.js
router.use('/users', require('./users.routes'));
```

Now `GET /api/users/7/posts` reaches the posts router with `req.params.userId === '7'`.

> **`{ mergeParams: true }`** — without it, a child router cannot see params captured by its parent's mount path.

## Putting it together — a clean skeleton

```
src/
├── server.js            # app.listen()
├── app.js               # create app, global middleware, mount /api, 404, errors
├── routes/
│   ├── index.js
│   ├── books.routes.js
│   └── users.routes.js
├── controllers/
├── middleware/
│   └── validateBook.js
└── data/
```

```js
// src/app.js
const express = require('express');
const morgan = require('morgan');

const app = express();
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', require('./routes'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
```

---

### Checklist for this chapter

- [ ] `express.Router()`
- [ ] Splitting routes into separate files
- [ ] Mounting a router with `app.use()`
- [ ] Route‑level middleware
- [ ] Route parameters with multiple segments
- [ ] Chaining route methods (`app.route()`)
- [ ] Nested routers

**Next:** [6. Error Handling →](guide/06-error-handling.md)
