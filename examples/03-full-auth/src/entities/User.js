// src/entities/User.js
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    email: { type: 'varchar', unique: true },
    passwordHash: { name: 'password_hash', type: 'varchar', select: false },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
  },
  relations: {
    tasks: {
      type: 'one-to-many',
      target: 'Task',
      inverseSide: 'user',
    },
  },
});
