// src/middleware/requireAuth.js
const { verifyToken } = require('../auth/token');
const HttpError = require('../errors/HttpError');

module.exports = function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing or malformed Authorization header'));
  }

  try {
    const payload = verifyToken(token); // throws if invalid / expired
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
};
