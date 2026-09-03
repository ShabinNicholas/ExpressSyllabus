// src/entities/Task.js
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Task',
  tableName: 'tasks',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    title: { type: 'varchar' },
    description: { type: 'varchar', default: '' },
    isDone: { name: 'is_done', type: 'boolean', default: false },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'user_id' }, // FK: tasks.user_id → users.id
      nullable: false,
      onDelete: 'CASCADE',
    },
  },
});
