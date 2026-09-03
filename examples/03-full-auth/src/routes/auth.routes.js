// src/routes/auth.routes.js
const express = require('express');
const auth = require('../controllers/auth.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(auth.register));
router.post('/login', asyncHandler(auth.login));

module.exports = router;
