// src/server.js
const config = require('./config');
const { AppDataSource } = require('./data-source');
const app = require('./app');

async function start() {
  try {
    await AppDataSource.initialize();
    console.log('PostgreSQL connected via TypeORM');
  } catch (err) {
    console.error('Could not connect to the database:', err.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port} (${config.env})`);
  });
}

start();

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await AppDataSource.destroy();
  process.exit(0);
});
