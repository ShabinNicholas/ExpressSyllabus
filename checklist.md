# Express.js Syllabus Checklist

> Tick off each topic as you cover it. From basic CRUD to JSON, middleware, auth & password hashing. *(PostgreSQL checklist to follow separately.)*

Each item links to where it's explained in the notes.

## 1. Getting Started with Express &nbsp;→ [notes](guide/01-getting-started.md)

- [ ] What is Express.js
- [ ] Express vs the plain http module
- [ ] Installing Express (`npm install express`)
- [ ] Creating an Express app (`express()`)
- [ ] `app.listen()`
- [ ] Choosing a port
- [ ] Testing the server is running
- [ ] Basic routing (`app.get`, `app.post`, `app.put`, `app.delete`)
- [ ] Route handler signature (`req`, `res`)
- [ ] Sending a response (`res.send()`)
- [ ] `res.status()`
- [ ] nodemon for development
- [ ] Restarting automatically on file changes
- [ ] Basic project folder structure

## 2. Basic CRUD (in‑memory, no JSON) &nbsp;→ [notes](guide/02-basic-crud.md)

- [ ] Storing data in an in‑memory array
- [ ] GET all items
- [ ] GET a single item by id
- [ ] Route parameters (`req.params`)
- [ ] Query parameters (`req.query`)
- [ ] POST create an item
- [ ] Generating a new id
- [ ] PUT update an item
- [ ] PATCH vs PUT (light)
- [ ] DELETE remove an item
- [ ] Handling "not found" cases
- [ ] Returning the right status code per operation

## 3. Working with JSON &nbsp;→ [notes](guide/03-working-with-json.md)

- [ ] Why JSON is needed
- [ ] `express.json()` middleware
- [ ] Reading a JSON body (`req.body`)
- [ ] Sending JSON responses (`res.json()`)
- [ ] Content‑Type header
- [ ] Handling missing / invalid JSON
- [ ] Validating required fields
- [ ] Common body‑parsing errors

## 4. Middleware &nbsp;→ [notes](guide/04-middleware.md)

- [ ] What is middleware
- [ ] The (`req`, `res`, `next`) signature
- [ ] `app.use()`
- [ ] Built‑in middleware (`express.json`, `express.static`)
- [ ] `express.static()` for serving files
- [ ] Custom middleware
- [ ] Middleware order matters
- [ ] `next()`
- [ ] Skipping remaining middleware
- [ ] Application‑level vs router‑level middleware
- [ ] Third‑party middleware (`cors`, `morgan`)

## 5. Routing in Depth &nbsp;→ [notes](guide/05-routing-in-depth.md)

- [ ] `express.Router()`
- [ ] Splitting routes into separate files
- [ ] Mounting a router with `app.use()`
- [ ] Route‑level middleware
- [ ] Route parameters with multiple segments
- [ ] Chaining route methods (`app.route()`)
- [ ] Nested routers

## 6. Error Handling &nbsp;→ [notes](guide/06-error-handling.md)

- [ ] try / catch in routes
- [ ] Passing errors with `next(err)`
- [ ] Error‑handling middleware (4 parameters)
- [ ] 404 Not Found handling
- [ ] Centralized error handler
- [ ] Sending proper status codes
- [ ] Custom error messages
- [ ] Handling async errors

## 7. Environment Variables & Config &nbsp;→ [notes](guide/07-environment-variables.md)

- [ ] `process.env` in Express
- [ ] `.env` file
- [ ] `dotenv` package
- [ ] PORT configuration
- [ ] Separating config from code
- [ ] Different configs for dev vs production
- [ ] `.gitignore` for `.env`

## 8. Authentication & Password Hashing &nbsp;→ [notes](guide/08-auth-password-hashing.md)

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

## 9. Connecting to a Database &nbsp;→ [notes](guide/09-connecting-to-a-database.md)

- [ ] Why use a database instead of in‑memory storage
- [ ] Installing a DB driver / ORM
- [ ] Connecting Express to a database
- [ ] Environment variables for DB connection
- [ ] Testing the DB connection
- [ ] Basic CRUD with a database (preview)
