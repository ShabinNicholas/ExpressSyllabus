// src/data-source.js
require('reflect-metadata');
const { DataSource } = require('typeorm');
const config = require('./config');
const Task = require('./entities/Task');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  entities: [Task],
  synchronize: !config.isProd, // dev only: auto-create/update tables from entities
  logging: !config.isProd,
  ssl: config.isProd ? { rejectUnauthorized: false } : false,
});

module.exports = { AppDataSource, Task };
