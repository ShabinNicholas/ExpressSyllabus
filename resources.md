# Resources & Reference

## Official docs

- [Express 4.x API reference](https://expressjs.com/en/4x/api.html)
- [Express guide: routing](https://expressjs.com/en/guide/routing.html)
- [Express guide: writing middleware](https://expressjs.com/en/guide/writing-middleware.html)
- [Express guide: error handling](https://expressjs.com/en/guide/error-handling.html)
- [Node.js docs](https://nodejs.org/docs/latest/api/)
- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)

## Packages used in these notes

| Package | Purpose | Chapter |
|---|---|---|
| [`express`](https://www.npmjs.com/package/express) | The framework | 1 |
| [`nodemon`](https://www.npmjs.com/package/nodemon) | Auto‑restart in dev | 1 |
| [`cors`](https://www.npmjs.com/package/cors) | Cross‑origin requests | 4 |
| [`morgan`](https://www.npmjs.com/package/morgan) | HTTP request logging | 4 |
| [`helmet`](https://www.npmjs.com/package/helmet) | Security headers | 4 |
| [`dotenv`](https://www.npmjs.com/package/dotenv) | Load `.env` files | 7 |
| [`bcrypt`](https://www.npmjs.com/package/bcrypt) / [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) | Password hashing | 8 |
| [`jsonwebtoken`](https://www.npmjs.com/package/jsonwebtoken) | Sign / verify JWTs | 8 |
| [`express-rate-limit`](https://www.npmjs.com/package/express-rate-limit) | Throttle requests | 8 |
| [`pg`](https://www.npmjs.com/package/pg) | PostgreSQL driver | 9 |
| [`prisma`](https://www.npmjs.com/package/prisma) | ORM | 9 |
| [`zod`](https://www.npmjs.com/package/zod) | Schema validation | 3 |

## HTTP status codes cheat sheet

### 2xx — Success

| Code | Name | Use it for |
|---|---|---|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST that created a resource |
| 204 | No Content | Successful request with nothing to return (often DELETE) |

### 3xx — Redirection

| Code | Name | Use it for |
|---|---|---|
| 301 | Moved Permanently | Resource URL changed for good |
| 302 | Found | Temporary redirect |
| 304 | Not Modified | Caching — client's copy is still fresh |

### 4xx — Client error

| Code | Name | Use it for |
|---|---|---|
| 400 | Bad Request | Malformed JSON, failed validation |
| 401 | Unauthorized | Missing / invalid authentication |
| 403 | Forbidden | Authenticated but not permitted |
| 404 | Not Found | No such resource or route |
| 405 | Method Not Allowed | Path exists, method doesn't |
| 409 | Conflict | Duplicate resource, version conflict |
| 422 | Unprocessable Entity | Well‑formed but semantically invalid |
| 429 | Too Many Requests | Rate limit exceeded |

### 5xx — Server error

| Code | Name | Use it for |
|---|---|---|
| 500 | Internal Server Error | Unhandled exception |
| 502 | Bad Gateway | Upstream service returned garbage |
| 503 | Service Unavailable | Down for maintenance, DB unreachable |

## `curl` quick reference

```bash
# GET
curl http://localhost:3000/books

# GET with headers shown
curl -i http://localhost:3000/books/1

# POST JSON
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Refactoring","year":1999}'

# PUT
curl -X PUT http://localhost:3000/books/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Refactoring, 2nd ed","year":2018}'

# PATCH
curl -X PATCH http://localhost:3000/books/1 \
  -H "Content-Type: application/json" \
  -d '{"year":2018}'

# DELETE
curl -X DELETE http://localhost:3000/books/1

# Send an auth token
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOi..."
```

## Recommended practice projects

1. **Notes API** — CRUD notes in memory, then add validation, then a DB.
2. **URL shortener** — POST a long URL, GET redirected from the short code.
3. **Auth starter** — register / login / protected `/me` route with bcrypt + JWT.
4. **Blog API** — users, posts, comments; nested routers; role‑based auth.

## Deploying this Docsify site to GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo **Settings → Pages → Build and deployment**.
3. **Source:** *Deploy from a branch*. **Branch:** `main`, **Folder:** `/ (root)`.
4. Save. The site publishes at `https://<username>.github.io/<repo>/`.
5. The `.nojekyll` file (already included) stops GitHub from trying to process the site with Jekyll.
