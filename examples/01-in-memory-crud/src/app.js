// src/app.js
const express = require('express');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(morgan('dev')); // environment-aware in Step 6
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tasks', require('./routes/tasks.routes'));

// unknown route → 404
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// central error handler — must be last
app.use(errorHandler);

module.exports = app;
