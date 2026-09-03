// src/store.js
// The whole "database" for this snapshot: an array in memory.
// Everything here is wiped when the process restarts — that's what Step 7 fixes.

const tasks = [];
let nextId = 1;

module.exports = {
  tasks,
  nextId: () => nextId++,
};
