# 01 — In-memory CRUD

Snapshot of the Task Manager API at the **end of Step 5**.

- No database. Tasks live in a plain array in `src/store.js` and reset every time the
  server restarts.
- No authentication.
- Full CRUD for `/api/tasks`, input validation, and one central error handler.

## Run it

```bash
npm install
npm run dev
```

Server starts on <http://localhost:3000>.

## Try it

```bash
BASE=http://localhost:3000

curl $BASE/health

# create
curl -X POST $BASE/api/tasks -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","description":"2 litres"}'

# list / filter
curl $BASE/api/tasks
curl "$BASE/api/tasks?done=false"

# get one / update / delete
curl $BASE/api/tasks/1
curl -X PATCH $BASE/api/tasks/1 -H "Content-Type: application/json" -d '{"is_done":true}'
curl -i -X DELETE $BASE/api/tasks/1        # 204

# failure paths
curl -i -X POST $BASE/api/tasks -H "Content-Type: application/json" -d '{}'          # 400
curl -i -X POST $BASE/api/tasks -H "Content-Type: application/json" -d '{"title":}'  # 400
curl -i $BASE/api/tasks/999                                                          # 404
curl -i $BASE/api/nope                                                               # 404
```

## Files

```
src/
├── server.js                     starts the HTTP server
├── app.js                        middleware pipeline, /health, mount /api, 404, error handler
├── store.js                      the in-memory tasks array + id counter
├── routes/tasks.routes.js        maps HTTP methods+paths → controller functions
├── controllers/tasks.controller.js   list, getOne, create, update, remove + validation
├── middleware/errorHandler.js    4-arg central error handler
└── errors/HttpError.js           an Error subclass carrying a status code
```
