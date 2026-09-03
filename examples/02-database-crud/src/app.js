// src/app.js
const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const { AppDataSource } = require('./data-source');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(morgan(config.isProd ? 'combined' : 'dev'));
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await AppDataSource.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

app.use('/api/tasks', require('./routes/tasks.routes'));

app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

module.exports = app;
