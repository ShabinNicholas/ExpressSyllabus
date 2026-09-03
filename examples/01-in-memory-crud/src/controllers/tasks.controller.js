// src/controllers/tasks.controller.js
const { tasks, nextId } = require('../store');
const HttpError = require('../errors/HttpError');

function validateTaskInput(body, { partial = false } = {}) {
  const data = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      throw new HttpError(400, 'title is required and must be a non-empty string');
    }
    data.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      throw new HttpError(400, 'description must be a string');
    }
    data.description = body.description;
  }

  if (body.is_done !== undefined) {
    if (typeof body.is_done !== 'boolean') {
      throw new HttpError(400, 'is_done must be a boolean');
    }
    data.isDone = body.is_done;
  }

  return data;
}

function findTask(id) {
  return tasks.find((t) => t.id === Number(id));
}

// GET /api/tasks           (optional ?done=true|false)
exports.list = (req, res) => {
  let result = tasks;

  if (req.query.done === 'true' || req.query.done === 'false') {
    const want = req.query.done === 'true';
    result = result.filter((t) => t.isDone === want);
  }

  res.json(result);
};

// GET /api/tasks/:id
exports.getOne = (req, res) => {
  const task = findTask(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  res.json(task);
};

// POST /api/tasks
exports.create = (req, res) => {
  const data = validateTaskInput(req.body);

  const task = {
    id: nextId(),
    title: data.title,
    description: data.description ?? '',
    isDone: data.isDone ?? false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);

  res.status(201).json(task);
};

// PATCH /api/tasks/:id
exports.update = (req, res) => {
  const data = validateTaskInput(req.body, { partial: true });
  if (Object.keys(data).length === 0) {
    throw new HttpError(400, 'No updatable fields provided');
  }

  const task = findTask(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');

  Object.assign(task, data);
  res.json(task);
};

// DELETE /api/tasks/:id
exports.remove = (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) throw new HttpError(404, 'Task not found');

  tasks.splice(index, 1);
  res.status(204).end();
};
