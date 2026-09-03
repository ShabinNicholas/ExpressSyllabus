// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs'); // guide uses 'bcrypt' — identical API
const { AppDataSource, User } = require('../data-source');
const config = require('../config');
const HttpError = require('../errors/HttpError');
const { signToken } = require('../auth/token');

const userRepo = () => AppDataSource.getRepository(User);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    throw new HttpError(400, 'A valid email is required');
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'password must be at least 8 characters');
  }

  const normalizedEmail = email.toLowerCase();

  const existing = await userRepo().findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw new HttpError(409, 'That email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

  const user = userRepo().create({ email: normalizedEmail, passwordHash });
  await userRepo().save(user);

  res.status(201).json({ id: user.id, email: user.email, createdAt: user.createdAt });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'email and password are required');
  }

  // passwordHash is select:false on the entity — ask for it explicitly here
  const user = await userRepo().findOne({
    where: { email: email.toLowerCase() },
    select: ['id', 'email', 'passwordHash'],
  });

  // Same error for unknown email OR wrong password → no email enumeration.
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const token = signToken(user);
  res.json({ token });
};
