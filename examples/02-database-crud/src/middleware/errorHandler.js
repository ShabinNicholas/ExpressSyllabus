// src/middleware/errorHandler.js
const config = require('../config');

module.exports = (err, req, res, next) => {
  // malformed JSON from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  // Postgres unique-constraint violation surfacing through TypeORM
  if (err.code === '23505') {
    return res.status(409).json({ error: 'That resource already exists' });
  }

  const status = err.status || 500;

  if (status === 500) {
    console.error(err);
  }

  const body = { error: err.message || 'Internal Server Error' };
  if (!config.isProd && status === 500) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
};
