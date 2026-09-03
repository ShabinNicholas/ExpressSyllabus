// src/controllers/tasks.controller.js
const { AppDataSource, Task } = require('../data-source');
const HttpError = require('../errors/HttpError');

const taskRepo = () => AppDataSource.getRepository(Task);

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

// GET /api/tasks           (optional ?done=true|false)
exports.list = async (req, res) => {
  const where = { user: { id: req.user.id } };
  if (req.query.done === 'true' || req.query.done === 'false') {
    where.isDone = req.query.done === 'true';
  }

  const tasks = await taskRepo().find({ where, order: { createdAt: 'DESC' } });
  res.json(tasks);
};

// GET /api/tasks/:id
exports.getOne = async (req, res) => {
  const task = await taskRepo().findOne({
    where: { id: Number(req.params.id), user: { id: req.user.id } },
  });
  if (!task) throw new HttpError(404, 'Task not found');
  res.json(task);
};

// POST /api/tasks
exports.create = async (req, res) => {
  const data = validateTaskInput(req.body);

  const task = taskRepo().create({ ...data, user: { id: req.user.id } });
  await taskRepo().save(task);

  res.status(201).json(task);
};

// PATCH /api/tasks/:id
exports.update = async (req, res) => {
  const data = validateTaskInput(req.body, { partial: true });
  if (Object.keys(data).length === 0) {
    throw new HttpError(400, 'No updatable fields provided');
  }

  const task = await taskRepo().findOne({
    where: { id: Number(req.params.id), user: { id: req.user.id } },
  });
  if (!task) throw new HttpError(404, 'Task not found');

  Object.assign(task, data);
  await taskRepo().save(task);
  res.json(task);
};

// DELETE /api/tasks/:id
exports.remove = async (req, res) => {
  const task = await taskRepo().findOne({
    where: { id: Number(req.params.id), user: { id: req.user.id } },
  });
  if (!task) throw new HttpError(404, 'Task not found');

  await taskRepo().remove(task);
  res.status(204).end();
};
