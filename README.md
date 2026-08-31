# Express.js Syllabus — Study Notes

> Tick off each topic as you cover it. From basic CRUD to JSON, middleware, auth & password hashing. *(PostgreSQL checklist to follow separately.)*

These notes expand every item on the Express.js syllabus checklist into a short explanation plus copy‑paste code you can run. Work through them in order — each chapter builds on the previous one.

## How to use this site

- **Sidebar** — jump to any chapter.
- **Search** (top of sidebar) — find a method like `res.json` or a topic like "salt rounds".
- **Copy button** — every code block has one.
- **[Checklist](checklist.md)** — the original tick‑list, with links into the notes.

## The 9 chapters

| # | Chapter | You will be able to… |
|---|---------|----------------------|
| 1 | [Getting Started](guide/01-getting-started.md) | Install Express, create an app, listen on a port, write your first routes |
| 2 | [Basic CRUD](guide/02-basic-crud.md) | Build create/read/update/delete over an in‑memory array with correct status codes |
| 3 | [Working with JSON](guide/03-working-with-json.md) | Parse request bodies, send JSON, validate fields, handle bad JSON |
| 4 | [Middleware](guide/04-middleware.md) | Understand `(req, res, next)`, `app.use()`, ordering, and third‑party middleware |
| 5 | [Routing in Depth](guide/05-routing-in-depth.md) | Split routes into files with `express.Router()` and mount them |
| 6 | [Error Handling](guide/06-error-handling.md) | Catch sync & async errors, build a central error handler, return proper codes |
| 7 | [Environment Variables & Config](guide/07-environment-variables.md) | Use `.env`, `dotenv`, and separate config from code |
| 8 | [Auth & Password Hashing](guide/08-auth-password-hashing.md) | Hash passwords with bcrypt, issue & verify JWTs, protect routes |
| 9 | [Connecting to a Database](guide/09-connecting-to-a-database.md) | Move from in‑memory storage to a real database connection |

## Prerequisites

- Node.js 18+ installed (`node -v`)
- Comfort with JavaScript: `const`/`let`, arrow functions, array methods, promises / `async`‑`await`
- A REST client for testing: `curl`, [Postman](https://www.postman.com/), [Insomnia](https://insomnia.rest/), or VS Code's REST Client extension

## Quick start

```bash
mkdir express-practice && cd express-practice
npm init -y
npm install express
npm install --save-dev nodemon
```

```js
// index.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello Express');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```

```bash
npx nodemon index.js
```

Open <http://localhost:3000> — you should see **Hello Express**. Now start [Chapter 1](guide/01-getting-started.md).
