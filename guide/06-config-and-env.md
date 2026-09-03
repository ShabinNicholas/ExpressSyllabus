# Step 6 — Config & Environment Variables

We're about to connect a database, which means a **connection string** — and later a **JWT secret**. Those are **secrets**: they must not live in source code, and they differ per machine. This step sets up `.env`, `dotenv`, and a single `config.js` so every later step has one clean place to read configuration from.

## Why environment variables

The same code has to run on your laptop, a teammate's laptop, and a production server — each with **different** database URLs, ports, and secrets. Hard‑coding those values means editing code per machine and, worse, committing secrets to git.

The fix: keep values in the **environment**, read them through `process.env`.

## `process.env`

Node exposes every environment variable on `process.env`. Values are **always strings** (or `undefined`):

```js
process.env.PORT        // '3000'  ← a string, not a number
process.env.NODE_ENV    // 'development' | 'production' | undefined
```

You *could* set them inline when launching:

```bash
PORT=4000 npm run dev          # macOS / Linux
$env:PORT=4000; npm run dev    # Windows PowerShell
```

…but that's tedious with many variables. Instead we use a `.env` file.

## The `.env` file

Create `.env` in the project root:

```bash
# .env
NODE_ENV=development
PORT=3000
```

We'll add `DATABASE_URL` in Step 7 and the `JWT_*` / `BCRYPT_*` variables in Steps 9–10. For now it's just these two.

Rules for `.env` files:

- `KEY=value` — **no spaces** around `=`.
- No quotes needed unless the value contains spaces.
- `#` starts a comment.
- One variable per line.

## `dotenv` — load the file

Node does **not** read `.env` automatically. Install `dotenv`:

```bash
npm install dotenv
```

It must be loaded **before** any code reads `process.env`. We'll load it at the very top of `config.js`, and make `config.js` the first thing `server.js` imports.

> Node 20.6+ has a built‑in alternative: `node --env-file=.env src/server.js`. We use `dotenv` here because it works on every version and is the common convention.

## `config.js` — one place for all config

Rather than sprinkle `process.env.X` across the codebase, read everything **once**, validate it, apply defaults and type conversions, and export a clean object.

```js
// src/config.js
require('dotenv').config();

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,
};

module.exports = config;
```

The `required()` helper isn't used yet — it earns its keep in Step 7 when `DATABASE_URL` becomes mandatory. Keep it; it's the pattern.

Why this is worth doing:

- **Fail fast.** A missing required variable crashes the app on startup with a clear message — not on the first request that needs it.
- **Types & defaults in one place.** `port` is a `Number`.
- **Nothing else touches `process.env`.** Every other file does `const config = require('./config')`.

## Use `config` in `server.js`

```js
// src/server.js
const config = require('./config');   // <-- first import: loads dotenv
const app = require('./app');

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port} (${config.env})`);
});
```

## Make `morgan` environment‑aware in `app.js`

Back in Step 3 we hard‑coded `morgan('dev')`. Now we can switch format by environment:

```js
// src/app.js
const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(morgan(config.isProd ? 'combined' : 'dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tasks', require('./routes/tasks.routes'));

app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

module.exports = app;
```

You can also make the error handler's stack‑trace check use `config.isProd` instead of reading `process.env.NODE_ENV` directly — same idea, one source of truth.

Restart:

```bash
npm run dev
# Server listening on http://localhost:3000 (development)
```

## `.env.example` — commit this one

`.env` is gitignored, so a teammate cloning the repo has no idea which variables to set. Commit a **template** with blank or dummy values:

```bash
# .env.example
NODE_ENV=development
PORT=3000
```

We'll add lines here every time a later step introduces a new variable. Setup for a new dev becomes: `cp .env.example .env`.

## `.gitignore` — confirm `.env` is ignored

We added this in Step 1. Double‑check it contains:

```bash
node_modules/
.env
.env.*
!.env.example      # keep tracking the template
*.log
```

Verify git is actually ignoring it:

```bash
git status --ignored
# .env should appear under "Ignored files"
```

If you already committed a real `.env`, remove it from tracking and rotate every secret it contained:

```bash
git rm --cached .env
git commit -m "Stop tracking .env"
```

## dev vs production config

With everything centralised, environment‑specific behaviour is a one‑liner:

```js
if (config.isProd) {
  // hide stack traces, use 'combined' logs, enable SSL to the DB...
}
```

You can also keep separate files — `.env.development`, `.env.production` — and load one based on `NODE_ENV`:

```js
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
```

For this course a single `.env` is enough.

## Where we are

```
src/
├── config.js   ✅ loads .env, exports typed config
├── app.js      ✅ morgan is now environment-aware
└── server.js   ✅ uses config.port
.env            ✅ (gitignored)
.env.example    ✅ (committed)
```

Config is sorted. Next: a real database — and `DATABASE_URL` becomes the first *required* variable.

---

**Concepts introduced here:** `process.env` · `.env` file · `dotenv` · `PORT` configuration · centralising config / separating config from code · fail‑fast validation · dev vs production configs · `.env.example` · `.gitignore` for `.env`

**Next:** [Step 7 — Connecting to PostgreSQL →](/guide/07-postgresql-connection.md)
