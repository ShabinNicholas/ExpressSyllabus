# 03 — Full auth (final state)

Snapshot of the Task Manager API at the **end of Step 12** — the finished project.

- Register (`POST /api/auth/register`) hashes the password with bcrypt.
- Login (`POST /api/auth/login`) returns a JWT.
- Every `/api/tasks` route is protected by a `requireAuth` middleware and scoped to the
  logged-in user — you only ever see your own tasks.

> This example uses [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) (pure JavaScript,
> installs with no build toolchain). The guide text uses [`bcrypt`](https://www.npmjs.com/package/bcrypt),
> the native addon — the API is identical, only the `require` line differs.

## Setup

```bash
npm install

psql -U postgres -c "CREATE DATABASE task_manager;"

cp .env.example .env
# then set a real JWT_SECRET:  openssl rand -hex 32
```

## Run it

```bash
npm run dev
```

TypeORM creates the `users` and `tasks` tables on first start.

## Try it

```bash
BASE=http://localhost:3000

curl -s $BASE/health

curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}'

TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s $BASE/api/tasks -H "Authorization: Bearer $TOKEN"
curl -s -X POST $BASE/api/tasks -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"title":"Buy milk"}'

curl -i $BASE/api/tasks            # 401 — no token
```

## Files added since example 02

```
src/
├── entities/User.js              users table (email unique, password_hash select:false)
├── entities/Task.js              now has a user_id FK → users.id
├── auth/token.js                 signToken / verifyToken
├── middleware/requireAuth.js     verify the JWT → req.user
├── controllers/auth.controller.js   register, login
├── routes/auth.routes.js         POST /register, POST /login
└── routes/index.js               mounts /auth + /tasks under /api
```
