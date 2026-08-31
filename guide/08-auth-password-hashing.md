# 8. Authentication & Password Hashing

**Authentication** = proving *who* a user is. Two pieces here:

1. **Password hashing** — storing passwords so a database leak doesn't expose them.
2. **JWT** — issuing a token after login so the user doesn't resend their password on every request.

## What is password hashing

Hashing runs a password through a **one‑way** function. You can compute `hash(password)` but you cannot reverse `hash → password`.

- **On register:** store `hash(password)`, throw away the plain password.
- **On login:** hash the submitted password and compare to the stored hash.

Hashing ≠ encryption. Encryption is reversible with a key; hashing is not reversible at all.

A password hashing function must also be **deliberately slow** and **salted** — that's why you use `bcrypt`, not `crypto.createHash('sha256')` (SHA‑256 is fast, which is bad here).

## Why plain‑text passwords are unsafe

- If the database is leaked, every account is instantly compromised.
- Users reuse passwords — your leak becomes a leak of their email, bank, etc.
- Anyone with DB access (employees, backups, logs) can read them.
- It may violate laws / standards (GDPR, PCI‑DSS, OWASP).

**Never** store, log, or email a plain password. **Never** send it back in an API response.

## `bcrypt` / `bcryptjs`

[`bcrypt`](https://www.npmjs.com/package/bcrypt) is the standard. It's a C++ addon (fast, needs a build toolchain). [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) is a pure‑JavaScript drop‑in with the same API — slightly slower, zero install headaches. Either is fine.

```bash
npm install bcrypt
# or
npm install bcryptjs
```

```js
const bcrypt = require('bcrypt');       // or require('bcryptjs')
```

A bcrypt hash is a single self‑describing string — it contains the algorithm, cost, salt, and digest:

```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
 │   │  └ salt (22 chars) ─┴───────── hash ─────────────────┘
 │   └ cost factor (10 = 2^10 rounds)
 └ algorithm version
```

## Salt rounds

A **salt** is random data mixed into the password before hashing, so two users with the same password get different hashes and precomputed ("rainbow table") attacks fail. bcrypt generates and stores the salt for you.

**Salt rounds** (the *cost factor*) is the log2 of the number of hashing iterations:

| Rounds | Iterations | Approx time |
|---|---|---|
| 10 | 1,024 | ~100 ms |
| 12 | 4,096 | ~400 ms |
| 14 | 16,384 | ~1.5 s |

- **10–12** is the common range. Higher = more resistant to brute force but slower logins.
- Put it in config, not hard‑coded: `Number(process.env.BCRYPT_SALT_ROUNDS) || 12`.

## Hashing a password before saving

```js
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// one-step (generates salt + hashes)
const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// two-step (equivalent, if you want the salt separately)
const salt = await bcrypt.genSalt(SALT_ROUNDS);
const hash = await bcrypt.hash(plainPassword, salt);
```

Store only `hash`. Never store `plainPassword` or the raw `salt` separately — it's already inside the hash.

## Comparing a hashed password on login

```js
const match = await bcrypt.compare(submittedPassword, storedHash);
// true  → password correct
// false → wrong password
```

`bcrypt.compare` re‑extracts the salt and cost from `storedHash`, hashes the submitted password the same way, and does a constant‑time comparison. **Never** hash the input yourself and `===` it.

## Basic register route

```js
// src/routes/auth.routes.js
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

// in-memory user store for learning
let users = [];
let nextId = 1;

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. validate
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }

    // 2. reject duplicates
    if (users.some((u) => u.email === email)) {
      return res.status(409).json({ error: 'email already registered' });
    }

    // 3. hash + save
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const user = { id: nextId++, email, passwordHash };
    users.push(user);

    // 4. respond WITHOUT the hash
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, users };
```

## Basic login route

```js
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = users.find((u) => u.email === email);

    // Use the SAME error for "no such user" and "wrong password"
    // so attackers can't enumerate valid emails.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});
```

## JWT basics (tokens)

A **JSON Web Token** is a signed string with three dot‑separated parts:

```
header.payload.signature
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImVtYWlsIjoiYUBiLmNvbSJ9.4pE...
```

- **header** — algorithm (`HS256`) and type.
- **payload** — "claims": `sub` (user id), `iat` (issued at), `exp` (expiry), plus anything you add. **Base64, not encrypted — never put secrets here.**
- **signature** — `HMAC-SHA256(header + payload, JWT_SECRET)`. Proves the token was issued by you and hasn't been tampered with.

Why tokens: the server stays **stateless**. It doesn't store sessions — it just verifies the signature on each request.

```bash
npm install jsonwebtoken
```

## Signing a token

```js
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { sub: user.id, email: user.email },   // payload / claims
  process.env.JWT_SECRET,                 // secret key (keep in .env!)
  { expiresIn: '1h' }                     // options: 15m, 1h, 7d, ...
);
```

- Keep the payload **small** and non‑sensitive.
- Always set `expiresIn` — short‑lived access tokens limit damage if stolen.
- `JWT_SECRET` must be long and random (`openssl rand -hex 32`) and live only in env vars.

## Verifying a token

```js
try {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  // payload = { sub: 1, email: 'a@b.com', iat: ..., exp: ... }
} catch (err) {
  // err.name === 'TokenExpiredError'  → 401, token expired
  // err.name === 'JsonWebTokenError'  → 401, invalid signature / malformed
}
```

`jwt.verify` throws if the signature is wrong or the token is expired — that's your rejection path.

## Storing the token (client side, light)

The browser needs to keep the token and send it back on each request.

| Storage | Pros | Cons |
|---|---|---|
| `localStorage` | Simple, survives refresh | Readable by any JS → vulnerable to XSS |
| `sessionStorage` | Cleared on tab close | Same XSS risk; lost on refresh in new tab |
| `httpOnly` cookie | Not readable by JS (XSS‑safe) | Needs CSRF protection; `SameSite` config |

Learning default: `localStorage` + `Authorization` header. Production: prefer an `httpOnly`, `Secure`, `SameSite=Strict` cookie.

```js
// client
localStorage.setItem('token', data.token);

await fetch('/api/profile', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
```

## Protecting routes (auth middleware)

```js
// src/middleware/requireAuth.js
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    req.user = jwt.verify(token, config.jwt.secret); // { sub, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

Apply it per route or per router:

```js
const requireAuth = require('../middleware/requireAuth');

router.get('/profile', requireAuth, (req, res) => {
  res.json({ id: req.user.sub, email: req.user.email });
});

// or protect a whole router
router.use(requireAuth);
```

Role checks build on top:

```js
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

router.delete('/users/:id', requireAuth, requireRole('admin'), handler);
```

## Sending 401 / 403 responses

| Code | Name | Meaning | Example |
|---|---|---|---|
| **401** | Unauthorized | *Not authenticated* — no valid credentials/token | Missing header, expired token, wrong password |
| **403** | Forbidden | *Authenticated but not allowed* — identity known, permission denied | Normal user hitting an admin‑only route |

Mnemonic: **401 = "who are you?"**, **403 = "I know who you are, and no."**

```js
res.status(401).json({ error: 'Authentication required' });
res.status(403).json({ error: 'You do not have permission to do that' });
```

## End‑to‑end flow

```
1. POST /api/auth/register  { email, password }
      → bcrypt.hash(password)  → store { email, passwordHash }  → 201

2. POST /api/auth/login  { email, password }
      → find user → bcrypt.compare(password, passwordHash)
      → jwt.sign({ sub: id }, SECRET, { expiresIn: '1h' })  → { token }

3. GET /api/profile   Authorization: Bearer <token>
      → requireAuth: jwt.verify(token, SECRET)  → req.user
      → 200 { profile }   |   401 if token bad/expired   |   403 if not allowed
```

## Security checklist

- [ ] Passwords hashed with bcrypt, cost ≥ 10
- [ ] Plain password never logged, stored, or returned
- [ ] `JWT_SECRET` is long, random, and only in env vars (see [Chapter 7](guide/07-environment-variables.md))
- [ ] Tokens have an expiry
- [ ] Login returns the same error for unknown email and wrong password
- [ ] Minimum password length enforced
- [ ] HTTPS in production (tokens/passwords travel in plaintext otherwise)
- [ ] Rate‑limit `/login` (`express-rate-limit`) to slow brute force

---

### Checklist for this chapter

- [ ] What is password hashing
- [ ] Why plain text passwords are unsafe
- [ ] bcrypt / bcryptjs
- [ ] Salt rounds
- [ ] Hashing a password before saving
- [ ] Comparing a hashed password on login
- [ ] Basic register route
- [ ] Basic login route
- [ ] JWT basics (tokens)
- [ ] Signing a token
- [ ] Verifying a token
- [ ] Storing the token (client side, light)
- [ ] Protecting routes (auth middleware)
- [ ] Sending 401 / 403 responses

**Next:** [9. Connecting to a Database →](guide/09-connecting-to-a-database.md)
