# Step 11 — Protecting Routes

The final feature. First we give each task an **owner**, then we add a **`requireAuth`** middleware that reads the JWT and attaches the user to `req`, apply it to the task routes, and scope every query to the logged‑in user. Now each user only sees their own tasks.

## Give `Task` an owner — the `user` relation

Until now `tasks` had no `user_id`. Add a **many‑to‑one** relation to `src/entities/Task.js`:

```js
// src/entities/Task.js
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Task',
  tableName: 'tasks',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    title: { type: 'varchar' },
    description: { type: 'varchar', default: '' },
    isDone: { name: 'is_done', type: 'boolean', default: false },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'user_id' },   // FK: tasks.user_id → users.id
      nullable: false,
      onDelete: 'CASCADE',               // delete a user → delete their tasks
    },
  },
});
```

Optionally add the inverse side to `User` (`tasks: { type: 'one-to-many', target: 'Task', inverseSide: 'user' }`).

> **Heads up:** you're adding a `NOT NULL` column to a table that may already have rows from Step 8. `synchronize` can't do that. In development, just clear the table and let TypeORM rebuild it:
> ```bash
> psql -U postgres -d task_manager -c "DROP TABLE IF EXISTS tasks CASCADE;"
> ```
> Restart — `synchronize` recreates `tasks` with the `user_id` FK. (In production this is a migration, not a drop.)

## Custom middleware — `src/middleware/requireAuth.js`

A **custom middleware**: `(req, res, next)`, does its check, then either calls `next()` (allow) or forwards a `401` and stops (deny).

```js
// src/middleware/requireAuth.js
const { verifyToken } = require('../auth/token');
const HttpError = require('../errors/HttpError');

module.exports = function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing or malformed Authorization header'));
  }

  try {
    const payload = verifyToken(token);          // throws if invalid / expired
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
};
```

How it fits the pipeline:

```
request → ... → requireAuth ─┬─ valid token  → req.user set → next() → controller
                             └─ bad/no token → 401, chain stops
```

## Apply it to the task routes

`router.use()` inside the tasks router applies the middleware to **every** route in that router:

```js
// src/routes/tasks.routes.js
const express = require('express');
const tasks = require('../controllers/tasks.controller');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);              // ← everything below is protected

router.get('/', asyncHandler(tasks.list));
router.post('/', asyncHandler(tasks.create));
router.get('/:id', asyncHandler(tasks.getOne));
router.patch('/:id', asyncHandler(tasks.update));
router.delete('/:id', asyncHandler(tasks.remove));

module.exports = router;
```

The `/api/auth/*` routes stay public — they're in a different router. `/health` stays public too.

> To protect a **single** route instead of the whole router:
> `router.post('/', requireAuth, asyncHandler(tasks.create));`

## Scope every query to `req.user.id`

Now that `requireAuth` sets `req.user`, add the owner to every task query in `src/controllers/tasks.controller.js`:

```js
// src/controllers/tasks.controller.js  (the changed lines)

exports.list = async (req, res) => {
  const where = { user: { id: req.user.id } };          // ← owner filter
  if (req.query.done === 'true' || req.query.done === 'false') {
    where.isDone = req.query.done === 'true';
  }
  const tasks = await taskRepo().find({ where, order: { createdAt: 'DESC' } });
  res.json(tasks);
};

exports.getOne = async (req, res) => {
  const task = await taskRepo().findOne({
    where: { id: Number(req.params.id), user: { id: req.user.id } },   // ←
  });
  if (!task) throw new HttpError(404, 'Task not found');
  res.json(task);
};

exports.create = async (req, res) => {
  const data = validateTaskInput(req.body);
  const task = taskRepo().create({ ...data, user: { id: req.user.id } });  // ←
  await taskRepo().save(task);
  res.status(201).json(task);
};

exports.update = async (req, res) => {
  const data = validateTaskInput(req.body, { partial: true });
  if (Object.keys(data).length === 0) throw new HttpError(400, 'No updatable fields provided');

  const task = await taskRepo().findOne({
    where: { id: Number(req.params.id), user: { id: req.user.id } },   // ←
  });
  if (!task) throw new HttpError(404, 'Task not found');

  Object.assign(task, data);
  await taskRepo().save(task);
  res.json(task);
};

exports.remove = async (req, res) => {
  const task = await taskRepo().findOne({
    where: { id: Number(req.params.id), user: { id: req.user.id } },   // ←
  });
  if (!task) throw new HttpError(404, 'Task not found');
  await taskRepo().remove(task);
  res.status(204).end();
};
```

### Why `user: { id: req.user.id }` matters

If `getOne` were just `where: { id }`, Alice could read Bob's task by guessing its id. With the `user` filter, a task that isn't hers simply isn't found → `404`. **The ownership check lives in the query, not a separate `if`.**

## 401 vs 403

| Code | Name | Meaning | In our API |
|---|---|---|---|
| **401** | Unauthorized | *Not authenticated* — no valid token | `requireAuth` rejects a missing/bad/expired token |
| **403** | Forbidden | *Authenticated, but not allowed* | Would apply if we had roles (e.g. a normal user hitting an admin route) |

Mnemonic: **401 = "who are you?"**, **403 = "I know who you are, and no."**

We don't have roles here, so we only use `401`. With an `is_admin` column and an admin‑only route:

```js
function requireAdmin(req, res, next) {
  if (!req.user.isAdmin) return next(new HttpError(403, 'Admins only'));
  next();
}
router.delete('/users/:id', requireAuth, requireAdmin, asyncHandler(users.remove));
```

## Test the protection

```bash
BASE=http://localhost:3000

# no token → 401
curl -i $BASE/api/tasks
# HTTP/1.1 401 Unauthorized

# get a token
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# with token → works, returns only Alice's tasks
curl $BASE/api/tasks -H "Authorization: Bearer $TOKEN"

curl -X POST $BASE/api/tasks -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"title":"Alice only task"}'

# garbage token → 401
curl -i $BASE/api/tasks -H "Authorization: Bearer not.a.real.token"
```

Register a second user, log in as them, and confirm `GET /api/tasks` returns `[]` — they can't see Alice's tasks.

## Final project structure

```
task-manager-api/
├── src/
│   ├── server.js                     start server, verify DB, graceful shutdown
│   ├── app.js                        middleware pipeline, mount /api, 404, error handler
│   ├── config.js                     env vars → typed config
│   ├── data-source.js                TypeORM DataSource
│   ├── entities/
│   │   ├── User.js
│   │   └── Task.js                   now has user_id FK
│   ├── auth/token.js                 signToken / verifyToken
│   ├── routes/
│   │   ├── index.js                  mounts /auth + /tasks
│   │   ├── auth.routes.js            POST /register, POST /login
│   │   └── tasks.routes.js           requireAuth + 5 CRUD routes
│   ├── controllers/
│   │   ├── auth.controller.js        register, login
│   │   └── tasks.controller.js       list, getOne, create, update, remove (owner-scoped)
│   ├── middleware/
│   │   ├── asyncHandler.js
│   │   ├── requireAuth.js
│   │   └── errorHandler.js
│   └── errors/HttpError.js
├── .env / .env.example / .gitignore
└── package.json
```

## Where we are

The project is **feature‑complete**: register, login, and a fully protected, per‑user Tasks CRUD on PostgreSQL — [`examples/03-full-auth/`](/resources.md#runnable-examples). Step 12 is a full end‑to‑end test run, a concept recap, and deployment notes.

---

**Concepts introduced here:** a many‑to‑one relation / foreign key · custom middleware · `requireAuth` (read `Authorization: Bearer`, `jwt.verify`, attach `req.user`) · `router.use()` to protect a whole router · route‑specific vs router‑wide middleware · ownership checks in the query · `401` vs `403`

**Next:** [Step 12 — Review, Test & Deploy →](/guide/12-review-and-deploy.md)
