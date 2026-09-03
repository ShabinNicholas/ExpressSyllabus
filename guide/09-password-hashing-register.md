# Step 9 — Password Hashing & Registration

Now we add accounts. This step: understand **password hashing**, add a **`User`** entity, use **bcrypt** with **salt rounds**, and build **`POST /api/auth/register`** which hashes the password before saving.

## What is password hashing

Hashing runs the password through a **one‑way** function. You can compute `hash(password)`, but you cannot go from `hash` back to `password`.

- **On register:** store `hash(password)`, discard the plain password.
- **On login (Step 10):** hash the submitted password and compare it to the stored hash.

Hashing is **not** encryption. Encryption is reversible with a key; a good password hash is not reversible at all.

## Why plain‑text passwords are unsafe

- If the database leaks, every account is instantly compromised.
- People reuse passwords — your leak becomes a leak of their email, bank, everything.
- Anyone with DB access (staff, backups, logs) can read them.

**Never** store, log, or email a plain password. **Never** return it in an API response.

## Why bcrypt (not `crypto` / SHA‑256)

A password hash function must be:

- **Slow / expensive** — so an attacker with the leaked hashes can only try a few thousand guesses per second, not billions. SHA‑256 is *fast*, which is exactly wrong here.
- **Salted** — a random value mixed in per‑password so two users with the same password get different hashes, and precomputed "rainbow table" attacks fail.

**bcrypt** does both. Install it:

```bash
npm install bcrypt
```

> [`bcrypt`](https://www.npmjs.com/package/bcrypt) is a native addon (needs a build toolchain). If it won't install on your machine, [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) is a pure‑JS drop‑in with the identical API — `npm install bcryptjs` and change the `require`. (The runnable example uses `bcryptjs` for exactly this reason.)

## Salt rounds

The **salt rounds** (a.k.a. *cost factor*) is how many times bcrypt iterates — expressed as a power of two:

| Rounds | Iterations | Approx time per hash |
|---|---|---|
| 10 | 1,024 | ~100 ms |
| 12 | 4,096 | ~300 ms |
| 14 | 16,384 | ~1.2 s |

- **10–12** is the normal range. Higher = harder to brute‑force, but slower logins.
- Put it in config. Add to `.env` **and** `.env.example`:

```bash
# .env  (and .env.example)
BCRYPT_SALT_ROUNDS=12
```

```js
// src/config.js — add to the config object
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
```

bcrypt generates the salt itself and stores it *inside* the hash string:

```
$2b$12$Nsd8kQ0m1c.../3mBq2   ← algorithm $ cost $ salt+digest
```

So you only store **one string** — no separate salt column.

## The `User` entity — `src/entities/User.js`

```js
// src/entities/User.js
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    email: {
      type: 'varchar',
      unique: true,             // the DB rejects duplicate emails
    },
    passwordHash: {
      name: 'password_hash',
      type: 'varchar',
      select: false,            // never returned by a normal find — see below
    },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
  },
});
```

Register it with the DataSource:

```js
// src/data-source.js
const User = require('./entities/User');
const Task = require('./entities/Task');

const AppDataSource = new DataSource({
  // ...
  entities: [User, Task],           // ← add User
});

module.exports = { AppDataSource, User, Task };
```

Restart — `synchronize` creates the `users` table.

### `select: false` — hiding the hash

With `select: false`, TypeORM **never includes `passwordHash`** in a normal `find` / `findOne` result. Login (Step 10) will ask for it explicitly; every other read of a user simply can't leak it.

## The auth controller — `src/controllers/auth.controller.js`

```js
// src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const { AppDataSource, User } = require('../data-source');
const config = require('../config');
const HttpError = require('../errors/HttpError');

const userRepo = () => AppDataSource.getRepository(User);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
  const { email, password } = req.body;

  // 1. validate
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    throw new HttpError(400, 'A valid email is required');
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'password must be at least 8 characters');
  }

  const normalizedEmail = email.toLowerCase();

  // 2. reject duplicates (the DB UNIQUE constraint is the backstop)
  const existing = await userRepo().findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw new HttpError(409, 'That email is already registered');
  }

  // 3. hash the password
  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

  // 4. build + save
  const user = userRepo().create({ email: normalizedEmail, passwordHash });
  await userRepo().save(user);   // INSERT — user.id, user.createdAt now populated

  // 5. respond WITHOUT the hash — pick fields explicitly
  res.status(201).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  });
};
```

Notes:

- **Explicit response object** — return only `id`, `email`, `createdAt`. Never spread the whole `user` (the in‑memory object still holds `passwordHash`).
- **Pre‑check + DB constraint** — `findOne` gives a clean `409`; the `UNIQUE` column is the safety net if two registrations race. If it fires, TypeORM throws with `err.code === '23505'`, which the Step 8 error handler already turns into a `409`.
- Email lower‑cased so `Bob@x.com` and `bob@x.com` are the same account.

## Routers — combine `auth` and `tasks`

Create a router file for auth, and one index that mounts both. `mkdir src/auth` isn't needed yet — that's Step 10.

```js
// src/routes/auth.routes.js
const express = require('express');
const auth = require('../controllers/auth.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(auth.register));
// router.post('/login', ...)   // Step 10

module.exports = router;
```

```js
// src/routes/index.js
const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/tasks', require('./tasks.routes'));

module.exports = router;
```

A router mounting other routers — perfectly normal, and now there's one place that lists every feature area.

## Mount it — `src/app.js`

Replace the direct `/api/tasks` mount with the combined router:

```js
// src/app.js  — the routing line becomes:
app.use('/api', require('./routes'));
```

So the full path is `/api` + `/auth` + `/register` = **`POST /api/auth/register`**, and the task routes are unchanged at `/api/tasks`.

## Test it

```bash
BASE=http://localhost:3000

# register
curl -i -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}'
# HTTP/1.1 201 Created
# {"id":1,"email":"alice@example.com","createdAt":"..."}

# duplicate → 409
curl -i -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}'

# weak password → 400
curl -i -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"short"}'
```

Check the database — the password is a bcrypt hash, not readable:

```bash
psql -U postgres -d task_manager -c "SELECT id, email, password_hash FROM users;"
#  id |       email       |                 password_hash
# ----+-------------------+------------------------------------------------
#   1 | alice@example.com | $2b$12$eW5...   ← hashed
```

## Where we are

```
src/
├── entities/User.js                   ✅ users table (email unique, hash hidden)
├── controllers/auth.controller.js     ✅ register: validate → check dup → hash → save
├── routes/auth.routes.js              ✅ POST /register
├── routes/index.js                    ✅ combines /auth + /tasks
└── app.js                             ✅ mounts /api
```

Accounts can be created and passwords are safely hashed. Next: logging in and issuing a JWT.

---

**Concepts introduced here:** what password hashing is · why plain‑text passwords are unsafe · bcrypt / bcryptjs · salt rounds / cost factor · `bcrypt.hash()` before saving · `select: false` to hide the hash · not returning the hash in a response · handling duplicate emails (`409`) · combining / nesting routers · the register route

**Next:** [Step 10 — Login & JWT →](/guide/10-login-and-jwt.md)
