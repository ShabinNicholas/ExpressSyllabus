# Step 10 — Login & JWT

Registration works. Now: a **`POST /api/auth/login`** route that checks the password with **`bcrypt.compare`** and, on success, issues a **JWT** the client uses for future requests.

## Comparing a hashed password on login

We stored a bcrypt hash. We never "un‑hash" it. Instead:

```js
const bcrypt = require('bcrypt');

const match = await bcrypt.compare(submittedPassword, storedHash);
// true  → password correct
// false → wrong password
```

`bcrypt.compare` reads the salt and cost out of `storedHash`, hashes the submitted password the same way, and compares in constant time. **Never** hash the input yourself and `===` it.

## JWT basics

A **JSON Web Token** is a signed string with three dot‑separated parts:

```
header . payload . signature
eyJhbGc... . eyJzdWIiOjF9 . 4pE7f...
```

- **header** — the algorithm (`HS256`).
- **payload** — the "claims": who the user is (`sub`), when it was issued (`iat`), when it expires (`exp`). **Base64‑encoded, not encrypted** — anyone can read it, so never put secrets here.
- **signature** — `HMAC‑SHA256(header + payload, JWT_SECRET)`. Proves *we* issued the token and it hasn't been altered.

Why tokens: the server stays **stateless**. It doesn't store sessions — each request carries the token, and we just verify the signature.

```bash
npm install jsonwebtoken
```

## Config

Add to `.env` **and** `.env.example`:

```bash
# .env  (.env.example — leave JWT_SECRET blank in the template)
JWT_SECRET=replace-this-with-a-long-random-string
JWT_EXPIRES_IN=1h
```

Generate a real secret: `openssl rand -hex 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

```js
// src/config.js — add to the config object
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
```

## Signing a token

```js
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { sub: user.id, email: user.email },   // payload
  config.jwt.secret,                      // secret from .env
  { expiresIn: config.jwt.expiresIn }     // e.g. '1h'
);
```

- Keep the payload **small** and non‑sensitive (an id and email are fine).
- **Always** set `expiresIn`. A stolen token stops working after it expires.

## Verifying a token (used in Step 11)

```js
try {
  const payload = jwt.verify(token, config.jwt.secret);
  // payload = { sub: 1, email: 'alice@example.com', iat: ..., exp: ... }
} catch (err) {
  // err.name === 'TokenExpiredError'  → expired
  // err.name === 'JsonWebTokenError'  → bad signature / malformed
}
```

`jwt.verify` throws if the signature is wrong or the token expired — that's the rejection path.

## A token helper — `src/auth/token.js`

Small module so signing/verifying live in one place:

```js
// src/auth/token.js
const jwt = require('jsonwebtoken');
const config = require('../config');

exports.signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

exports.verifyToken = (token) => jwt.verify(token, config.jwt.secret);
```

```bash
mkdir src/auth
```

## The login controller

Add to `src/controllers/auth.controller.js`:

```js
const { signToken } = require('../auth/token');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'email and password are required');
  }

  // passwordHash is select:false on the entity, so we ask for it explicitly here
  const user = await userRepo().findOne({
    where: { email: email.toLowerCase() },
    select: ['id', 'email', 'passwordHash'],
  });

  // Same error whether the email is unknown OR the password is wrong,
  // so an attacker can't discover which emails are registered.
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const token = signToken(user);
  res.json({ token });
};
```

Points:

- **One generic `401`** for "no such user" and "wrong password" — prevents email enumeration.
- **`select: ['id', 'email', 'passwordHash']`** — because the entity marks `passwordHash` as `select: false`, we must name it explicitly to load it. We need it for `bcrypt.compare`, but it never leaves the server.
- On success we return only `{ token }`.

## The login route

```js
// src/routes/auth.routes.js
const express = require('express');
const auth = require('../controllers/auth.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(auth.register));
router.post('/login', asyncHandler(auth.login));

module.exports = router;
```

## Test it

```bash
BASE=http://localhost:3000

# log in with the account from Step 9
curl -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}'
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoi..."}

# wrong password → 401
curl -i -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"wrong"}'

# unknown email → also 401 (same message)
curl -i -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ghost@example.com","password":"whatever"}'
```

Paste a valid token into <https://jwt.io> to see the decoded header and payload. You can read it without the secret — but you can't *forge* one without it.

## Storing the token (client side)

The browser keeps the token and sends it back on each request in the `Authorization` header:

```js
// after login
localStorage.setItem('token', data.token);

// on later requests
fetch('/api/tasks', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
```

| Storage | Trade‑off |
|---|---|
| `localStorage` | Simple; readable by any JS → vulnerable to XSS |
| `httpOnly` cookie | Not readable by JS (XSS‑safe); needs CSRF protection |

For learning, `localStorage` + `Authorization: Bearer` is fine. Production apps often prefer an `httpOnly`, `Secure`, `SameSite` cookie.

## Where we are

```
src/
├── auth/token.js                    ✅ signToken / verifyToken
├── controllers/auth.controller.js   ✅ register + login
└── routes/auth.routes.js            ✅ POST /register, POST /login
```

We can hand out tokens. Step 11 uses them: a `requireAuth` middleware that protects the task routes and scopes every task to the logged‑in user.

---

**Concepts introduced here:** `bcrypt.compare()` on login · JWT structure (header/payload/signature) · signing a token (`jwt.sign`, `expiresIn`) · verifying a token (`jwt.verify`) · generic login error / preventing email enumeration · storing the token client‑side

**Next:** [Step 11 — Protecting Routes →](/guide/11-protecting-routes.md)
