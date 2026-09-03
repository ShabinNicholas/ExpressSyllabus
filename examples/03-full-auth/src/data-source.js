// src/data-source.js
require('reflect-metadata');
const { DataSource } = require('typeorm');
const config = require('./config');
const User = require('./entities/User');
const Task = require('./entities/Task');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  entities: [User, Task],
  synchronize: !config.isProd,
  logging: !config.isProd,
  ssl: config.isProd ? { rejectUnauthorized: false } : false,
});

module.exports = { AppDataSource, User, Task };
