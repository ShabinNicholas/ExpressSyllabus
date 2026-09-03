// src/middleware/errorHandler.js
// Express recognises an error handler by its FOUR parameters.
module.exports = (err, req, res, next) => {
  // malformed JSON from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  const status = err.status || 500;

  if (status === 500) {
    console.error(err);
  }

  const body = { error: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV !== 'production' && status === 500) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
};
