// src/routes/tasks.routes.js
const express = require('express');
const tasks = require('../controllers/tasks.controller');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth); // everything below is protected

router.get('/', asyncHandler(tasks.list));
router.post('/', asyncHandler(tasks.create));
router.get('/:id', asyncHandler(tasks.getOne));
router.patch('/:id', asyncHandler(tasks.update));
router.delete('/:id', asyncHandler(tasks.remove));

module.exports = router;
