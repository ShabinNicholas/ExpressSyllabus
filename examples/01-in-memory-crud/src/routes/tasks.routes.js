// src/routes/tasks.routes.js
const express = require('express');
const tasks = require('../controllers/tasks.controller');

const router = express.Router();

router.get('/', tasks.list);
router.post('/', tasks.create);
router.get('/:id', tasks.getOne);
router.patch('/:id', tasks.update);
router.delete('/:id', tasks.remove);

module.exports = router;
