# Step 1 — Project Setup

We are going to build **one complete project** from start to finish: a **Task Manager API**. Every Express concept from the syllabus is taught at the moment we actually need it — no isolated toy examples.

## How this course is laid out

We climb the ladder one rung at a time. Each stage is a program that runs:

1. **Steps 1–5** — a working REST API with full CRUD, kept entirely **in memory** (a plain array). No database, no login. This is where you learn routing, middleware, JSON, and error handling.
2. **Steps 6–8** — move that same API onto a real **PostgreSQL** database with the **TypeORM** ORM. The routes don't change; only where the data lives changes.
3. **Steps 9–11** — add **accounts**: register, hash passwords with bcrypt, log in for a **JWT**, and protect the task routes so each user only sees their own tasks.
4. **Step 12** — end‑to‑end test, a recap of every syllabus concept, and deployment.

> There is a runnable snapshot of the project at the end of Steps 5, 8, and 12 — see [Resources → Runnable examples](/resources.md#runnable-examples).

## What we're building (the finished picture)

A REST API where a person **registers**, **logs in** to get a **JWT token**, and then **creates, reads, updates and deletes their own tasks**. One user can never touch another user's tasks.

| Method | Path | Purpose | Protected? | Built in |
|---|---|---|---|---|
| `GET` | `/health` | Is the server (and DB) alive? | No | Step 2 / 7 |
| `GET` `POST` | `/api/tasks` | List / create tasks | Later | Step 4 |
| `GET` `PATCH` `DELETE` | `/api/tasks/:id` | One task | Later | Step 4 |
| `POST` | `/api/auth/register` | Create an account | No | Step 9 |
| `POST` | `/api/auth/login` | Get a token | No | Step 10 |

The task routes become **protected** in Step 11.

## What is Express.js?

**Express is a small web framework for Node.js.** Node can already run an HTTP server on its own (the built‑in `http` module), but with raw `http` you manually check `req.method` and `req.url` with `if` statements, manually set headers, and manually parse the request body.

Express gives you:

- **Routing** — `app.get('/tasks', handler)` instead of `if (req.method === 'GET' && req.url === '/tasks')`.
- **Middleware** — a pipeline of functions every request flows through (parsing, logging, auth…).
- **Helpers** — `res.json(data)`, `res.status(404)`, `req.params.id`, `req.body`.

Same idea, far less boilerplate. We'll meet each of these as we build.

## Prerequisites

```bash
node -v     # v18 or newer
npm -v
```

PostgreSQL is only needed from **Step 6** onward — we'll install it then.

You also want a way to send HTTP requests: `curl` (used throughout this course), or [Postman](https://www.postman.com/) / [Insomnia](https://insomnia.rest/) if you prefer a GUI.

## Create the project

```bash
mkdir task-manager-api
cd task-manager-api
npm init -y
```

`npm init -y` creates `package.json` — the file that records your dependencies and scripts.

## Install the first dependencies

```bash
npm install express
npm install --save-dev nodemon
```

- **express** — the framework (a normal dependency, shipped to production).
- **nodemon** — restarts the server automatically every time you save a file. Development only, hence `--save-dev`.

Every other package (`dotenv`, `typeorm`, `pg`, `bcrypt`, `jsonwebtoken`, …) gets installed in the step that first uses it — so you always know *why* it's there.

## Set up the folder structure

Start small. Create just this:

```
task-manager-api/
├── src/
│   ├── server.js     # starts the HTTP server
│   └── app.js        # builds the Express app (middleware + routes)
├── .gitignore
└── package.json
```

```bash
mkdir src
```

New folders (`routes/`, `controllers/`, `middleware/`, `errors/`, `entities/`, `auth/`) appear in later steps, each when a step needs it — not before.

> **Why split `server.js` and `app.js`?** `app.js` only *builds* the app and exports it. `server.js` *imports* it and calls `.listen()`. This keeps the app importable in tests without actually opening a network port.

## Add npm scripts

Open `package.json` and set the `scripts` block:

```json
{
  "name": "task-manager-api",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

- `npm start` — plain Node, for production.
- `npm run dev` — nodemon, for development. This is what you'll run while following the course.

## Create `.gitignore`

Before the first commit, make sure `node_modules` (and, later, secrets) never get tracked:

```bash
# .gitignore
node_modules/
.env
.env.*
!.env.example
*.log
.DS_Store
```

## Where we are

Nothing runs yet — we have an empty skeleton. In **Step 2** we write `app.js` and `server.js` and get a live server responding to requests.

---

**Concepts introduced here:** what Express is · Express vs the `http` module · installing Express · project structure · `nodemon` · npm scripts

**Next:** [Step 2 — Your First Server →](/guide/02-first-server.md)
