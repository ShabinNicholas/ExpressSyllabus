# Syllabus Coverage

The original Express.js checklist. Every item links to the build step where it's taught inside the **Task Manager API** project.

> Tick off each topic as you cover it. From basic CRUD to JSON, middleware, auth & password hashing. *(PostgreSQL checklist to follow separately.)*

## 1. Getting Started with Express

| ✔ | Topic | Where |
|---|---|---|
| ☐ | What is Express.js | [Step 1](guide/01-project-setup.md) |
| ☐ | Express vs the plain http module | [Step 1](guide/01-project-setup.md) |
| ☐ | Installing Express (`npm install express`) | [Step 1](guide/01-project-setup.md) |
| ☐ | Creating an Express app (`express()`) | [Step 2](guide/02-first-server.md) |
| ☐ | `app.listen()` | [Step 2](guide/02-first-server.md) |
| ☐ | Choosing a port | [Step 2](guide/02-first-server.md) · [Step 6](guide/06-config-and-env.md) |
| ☐ | Testing the server is running | [Step 2](guide/02-first-server.md) |
| ☐ | Basic routing (`app.get/post/put/delete`) | [Step 2](guide/02-first-server.md) |
| ☐ | Route handler signature (`req`, `res`) | [Step 2](guide/02-first-server.md) |
| ☐ | Sending a response (`res.send()`) | [Step 2](guide/02-first-server.md) |
| ☐ | `res.status()` | [Step 2](guide/02-first-server.md) |
| ☐ | nodemon for development | [Step 1](guide/01-project-setup.md) · [Step 2](guide/02-first-server.md) |
| ☐ | Restarting automatically on file changes | [Step 2](guide/02-first-server.md) |
| ☐ | Basic project folder structure | [Step 1](guide/01-project-setup.md) |

## 2. Basic CRUD

| ✔ | Topic | Where |
|---|---|---|
| ☐ | Storing data (array → database) | [Step 4](guide/04-tasks-crud-in-memory.md) · [Step 8](guide/08-tasks-crud-database.md) |
| ☐ | GET all items | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | GET a single item by id | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | Route parameters (`req.params`) | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | Query parameters (`req.query`) | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | POST create an item | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | Generating a new id (counter → TypeORM `generated: true`) | [Step 4](guide/04-tasks-crud-in-memory.md) · [Step 7](guide/07-postgresql-connection.md) |
| ☐ | PUT / PATCH update an item | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | PATCH vs PUT | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | DELETE remove an item | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | Handling "not found" cases | [Step 4](guide/04-tasks-crud-in-memory.md) · [Step 5](guide/05-validation-and-errors.md) |
| ☐ | Right status code per operation | [Step 4](guide/04-tasks-crud-in-memory.md) |

## 3. Working with JSON

| ✔ | Topic | Where |
|---|---|---|
| ☐ | Why JSON is needed | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | `express.json()` middleware | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | Reading a JSON body (`req.body`) | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | Sending JSON responses (`res.json()`) | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | Content-Type header | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | Handling missing / invalid JSON | [Step 5](guide/05-validation-and-errors.md) |
| ☐ | Validating required fields | [Step 5](guide/05-validation-and-errors.md) · [Step 9](guide/09-password-hashing-register.md) |
| ☐ | Common body-parsing errors | [Step 3](guide/03-json-and-middleware.md) · [Step 5](guide/05-validation-and-errors.md) |

## 4. Middleware

| ✔ | Topic | Where |
|---|---|---|
| ☐ | What is middleware | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | The `(req, res, next)` signature | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | `app.use()` | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | Built-in middleware (`express.json`, `express.static`) | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | Custom middleware | [Step 3](guide/03-json-and-middleware.md) · [Step 11](guide/11-protecting-routes.md) |
| ☐ | Middleware order matters | [Step 3](guide/03-json-and-middleware.md) |
| ☐ | `next()` | [Step 3](guide/03-json-and-middleware.md) · [Step 5](guide/05-validation-and-errors.md) |
| ☐ | Application-level vs router-level middleware | [Step 4](guide/04-tasks-crud-in-memory.md) · [Step 11](guide/11-protecting-routes.md) |
| ☐ | Third-party middleware (`cors`, `morgan`, `helmet`) | [Step 3](guide/03-json-and-middleware.md) · [Step 12](guide/12-review-and-deploy.md) |

## 5. Routing in Depth

| ✔ | Topic | Where |
|---|---|---|
| ☐ | `express.Router()` | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | Splitting routes into separate files | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | Mounting a router with `app.use()` | [Step 4](guide/04-tasks-crud-in-memory.md) |
| ☐ | Router-level middleware | [Step 11](guide/11-protecting-routes.md) |
| ☐ | Combining / nesting routers | [Step 9](guide/09-password-hashing-register.md) |

## 6. Error Handling

| ✔ | Topic | Where |
|---|---|---|
| ☐ | try / catch in routes | [Step 5](guide/05-validation-and-errors.md) · [Step 8](guide/08-tasks-crud-database.md) |
| ☐ | Passing errors with `next(err)` | [Step 5](guide/05-validation-and-errors.md) |
| ☐ | Error-handling middleware (4 parameters) | [Step 5](guide/05-validation-and-errors.md) |
| ☐ | 404 Not Found handling | [Step 5](guide/05-validation-and-errors.md) |
| ☐ | Centralized error handler | [Step 5](guide/05-validation-and-errors.md) |
| ☐ | Sending proper status codes | [Step 5](guide/05-validation-and-errors.md) |
| ☐ | Handling async errors (`asyncHandler`) | [Step 8](guide/08-tasks-crud-database.md) |

## 7. Environment Variables & Config

| ✔ | Topic | Where |
|---|---|---|
| ☐ | `process.env` in Express | [Step 6](guide/06-config-and-env.md) |
| ☐ | `.env` file | [Step 6](guide/06-config-and-env.md) |
| ☐ | `dotenv` package | [Step 6](guide/06-config-and-env.md) |
| ☐ | PORT configuration | [Step 6](guide/06-config-and-env.md) |
| ☐ | Separating config from code | [Step 6](guide/06-config-and-env.md) |
| ☐ | Different configs for dev vs production | [Step 6](guide/06-config-and-env.md) · [Step 12](guide/12-review-and-deploy.md) |
| ☐ | `.gitignore` for `.env` | [Step 1](guide/01-project-setup.md) · [Step 6](guide/06-config-and-env.md) |

## 8. Authentication & Password Hashing

| ✔ | Topic | Where |
|---|---|---|
| ☐ | What is password hashing | [Step 9](guide/09-password-hashing-register.md) |
| ☐ | Why plain text passwords are unsafe | [Step 9](guide/09-password-hashing-register.md) |
| ☐ | bcrypt / bcryptjs | [Step 9](guide/09-password-hashing-register.md) |
| ☐ | Salt rounds | [Step 9](guide/09-password-hashing-register.md) |
| ☐ | Hashing a password before saving | [Step 9](guide/09-password-hashing-register.md) |
| ☐ | Comparing a hashed password on login | [Step 10](guide/10-login-and-jwt.md) |
| ☐ | Basic register route | [Step 9](guide/09-password-hashing-register.md) |
| ☐ | Basic login route | [Step 10](guide/10-login-and-jwt.md) |
| ☐ | JWT basics (tokens) | [Step 10](guide/10-login-and-jwt.md) |
| ☐ | Signing a token | [Step 10](guide/10-login-and-jwt.md) |
| ☐ | Verifying a token | [Step 10](guide/10-login-and-jwt.md) · [Step 11](guide/11-protecting-routes.md) |
| ☐ | Storing the token (client side) | [Step 10](guide/10-login-and-jwt.md) |
| ☐ | Protecting routes (auth middleware) | [Step 11](guide/11-protecting-routes.md) |
| ☐ | Sending 401 / 403 responses | [Step 11](guide/11-protecting-routes.md) |

## 9. Connecting to a Database

| ✔ | Topic | Where |
|---|---|---|
| ☐ | Why use a database instead of in-memory storage | [Step 7](guide/07-postgresql-connection.md) |
| ☐ | Installing a DB driver / ORM (TypeORM + `pg`) | [Step 7](guide/07-postgresql-connection.md) |
| ☐ | Connecting Express to a database (DataSource) | [Step 7](guide/07-postgresql-connection.md) |
| ☐ | Environment variables for DB connection | [Step 6](guide/06-config-and-env.md) · [Step 7](guide/07-postgresql-connection.md) |
| ☐ | Testing the DB connection | [Step 7](guide/07-postgresql-connection.md) |
| ☐ | Basic CRUD with a database | [Step 8](guide/08-tasks-crud-database.md) · [Step 11](guide/11-protecting-routes.md) |
