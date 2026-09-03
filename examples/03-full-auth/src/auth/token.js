// src/auth/token.js
const jwt = require('jsonwebtoken');
const config = require('../config');

exports.signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

exports.verifyToken = (token) => jwt.verify(token, config.jwt.secret);
