# 7. Environment Variables & Config

**Environment variables** keep settings and secrets *outside* your source code, so the same code can run on your laptop, a teammate's machine, CI, and production — each with different values.

## `process.env` in Express

Node exposes all environment variables on the `process.env` object. Values are **always strings** (or `undefined`).

```js
console.log(process.env.NODE_ENV);   // 'development' | 'production' | undefined
console.log(process.env.PORT);       // '3000'  (string!)

const port = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
```

Set them inline when launching (works, but tedious):

```bash
# macOS / Linux
PORT=4000 NODE_ENV=production node index.js

# Windows PowerShell
$env:PORT=4000; node index.js
```

Better: keep them in a file.

## `.env` file

A `.env` file is a simple `KEY=value` list at the project root:

```bash
# .env
PORT=3000
NODE_ENV=development
JWT_SECRET=super-secret-change-me
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
BCRYPT_SALT_ROUNDS=10
```

Rules:

- No spaces around `=` (`KEY=value`, not `KEY = value`).
- No quotes needed unless the value has spaces: `GREETING="hello world"`.
- `#` starts a comment.
- One variable per line.

Node does **not** read `.env` automatically — you need `dotenv` (or Node 20.6+'s `--env-file` flag).

## `dotenv` package

```bash
npm install dotenv
```

Load it **once, as early as possible**, before any code that reads `process.env`:

```js
// src/config.js  (or the very top of index.js / server.js)
require('dotenv').config();
```

```js
// index.js
require('dotenv').config();       // <-- first line
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
```

ESM version:

```js
import 'dotenv/config';
```

Node 20.6+ built‑in alternative (no package):

```bash
node --env-file=.env index.js
```

`dotenv` **does not overwrite** variables that are already set in the real environment — production values win over the file.

## `PORT` configuration

Hosting platforms (Render, Railway, Heroku, Fly, etc.) assign a port and pass it as `process.env.PORT`. Your app must respect it:

```js
const PORT = process.env.PORT || 3000; // platform value, else local default
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

Never hard‑code `app.listen(3000)` in code you'll deploy.

## Separating config from code

Centralize all env reads in **one module**. The rest of the app imports from it — nothing else touches `process.env`. This gives you one place to validate, document, and set defaults.

```js
// src/config.js
require('dotenv').config();

function required(key) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  db: {
    url: required('DATABASE_URL'),
  },

  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  },
};
```

```js
// usage anywhere
const config = require('./config');
app.listen(config.port);
jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
```

Validating on startup means the app **fails fast** with a clear message instead of blowing up on the first request that needs a missing secret.

For heavier needs, libraries like [`envalid`](https://github.com/af/envalid), [`zod`](https://zod.dev/) or [`convict`](https://github.com/mozilla/node-convict) do typed validation of the whole env.

## Different configs for dev vs production

### By `NODE_ENV`

```js
const config = require('./config');

if (config.isProd) {
  app.use(morgan('combined'));
  app.use(helmet());
} else {
  app.use(morgan('dev'));
}
```

### By multiple env files

A common convention (supported by `dotenv-flow`, `env-cmd`, Next.js, etc.):

```
.env                # shared defaults, committed WITHOUT secrets
.env.development    # local dev overrides (gitignored if it has secrets)
.env.production     # prod values — usually set in the host dashboard, not a file
.env.example        # template with blank/dummy values — COMMITTED
```

Load a specific one:

```js
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
});
```

### `.env.example` — commit this

Give teammates a checklist of what to fill in:

```bash
# .env.example
PORT=3000
NODE_ENV=development
JWT_SECRET=
DATABASE_URL=
BCRYPT_SALT_ROUNDS=10
```

New devs run `cp .env.example .env` and fill in the blanks.

## `.gitignore` for `.env`

**Never commit real secrets.** A leaked `JWT_SECRET` or `DATABASE_URL` in git history is compromised even after you delete it.

```bash
# .gitignore
node_modules/
.env
.env.*
!.env.example
*.log
```

- `.env` and `.env.*` → ignored.
- `!.env.example` → the exception, keep tracking the template.

If you already committed a `.env`:

```bash
git rm --cached .env
git commit -m "Stop tracking .env"
# then rotate every secret that was in it
```

In production, set the variables in the platform's dashboard / secret manager rather than uploading a file.

---

### Checklist for this chapter

- [ ] `process.env` in Express
- [ ] `.env` file
- [ ] `dotenv` package
- [ ] `PORT` configuration
- [ ] Separating config from code
- [ ] Different configs for dev vs production
- [ ] `.gitignore` for `.env`

**Next:** [8. Authentication & Password Hashing →](guide/08-auth-password-hashing.md)
