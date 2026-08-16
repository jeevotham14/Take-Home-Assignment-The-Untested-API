const taskService = require('../src/services/taskService');

// Resets the task store before each test so tests don't affect each other
beforeEach(() => taskService._reset());

// ─────────────────────────────────────────
// create()
// ─────────────────────────────────────────
describe('create()', () => {
  it('creates a task with the given title', () => {
    const task = taskService.create({ title: 'Test Task' });
    expect(task.title).toBe('Test Task');
  });

  it('sets default status to todo', () => {
    const task = taskService.create({ title: 'Test Task' });
    expect(task.status).toBe('todo');
  });

  it('sets default priority to medium', () => {
    const task = taskService.create({ title: 'Test Task' });
    expect(task.priority).toBe('medium');
  });

  it('gives the task a unique id', () => {
    const task = taskService.create({ title: 'Test Task' });
    expect(task.id).toBeDefined();
  });

  it('sets completedAt to null by default', () => {
    const task = taskService.create({ title: 'Test Task' });
    expect(task.completedAt).toBeNull();
  });
});

// ─────────────────────────────────────────
// getAll()
// ─────────────────────────────────────────
describe('getAll()', () => {
  it('returns empty array when no tasks', () => {
    expect(taskService.getAll()).toEqual([]);
  });

  it('returns all created tasks', () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });
    expect(taskService.getAll()).toHaveLength(2);
  });
});

// ─────────────────────────────────────────
// findById()
// ─────────────────────────────────────────
describe('findById()', () => {
  it('returns the correct task by id', () => {
    const task = taskService.create({ title: 'Find Me' });
    const found = taskService.findById(task.id);
    expect(found.title).toBe('Find Me');
  });

  it('returns undefined for a bad id', () => {
    const found = taskService.findById('fake-id-123');
    expect(found).toBeUndefined();
  });
});

// ─────────────────────────────────────────
// getByStatus()
// ─────────────────────────────────────────
describe('getByStatus()', () => {
  it('returns only tasks with the exact matching status', () => {
    taskService.create({ title: 'Todo Task', status: 'todo' });
    taskService.create({ title: 'Done Task', status: 'done' });
    const result = taskService.getByStatus('todo');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Todo Task');
  });

  it('does not return tasks with a different status', () => {
    taskService.create({ title: 'Done Task', status: 'done' });
    const result = taskService.getByStatus('todo');
    expect(result).toHaveLength(0);
  });

  it('does not do partial/substring match on status', () => {
    taskService.create({ title: 'Todo Task', status: 'todo' });
    taskService.create({ title: 'Done Task', status: 'done' });
    // "do" is a substring of both "todo" and "done" — should return 0 tasks
    const result = taskService.getByStatus('do');
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────
// getPaginated()
// ─────────────────────────────────────────
describe('getPaginated()', () => {
  it('returns first page of tasks correctly', () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });
    taskService.create({ title: 'Task 3' });
    const result = taskService.getPaginated(1, 2);
    expect(result[0].title).toBe('Task 1');
    expect(result).toHaveLength(2);
  });

  it('returns second page of tasks correctly', () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });
    taskService.create({ title: 'Task 3' });
    const result = taskService.getPaginated(2, 2);
    expect(result[0].title).toBe('Task 3');
  });
});

// ─────────────────────────────────────────
// update()
// ─────────────────────────────────────────
describe('update()', () => {
  it('updates task fields', () => {
    const task = taskService.create({ title: 'Old Title' });
    const updated = taskService.update(task.id, { title: 'New Title' });
    expect(updated.title).toBe('New Title');
  });

  it('returns null for a bad id', () => {
    const result = taskService.update('fake-id', { title: 'X' });
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────
// remove()
// ─────────────────────────────────────────
describe('remove()', () => {
  it('removes a task and returns true', () => {
    const task = taskService.create({ title: 'Delete Me' });
    const result = taskService.remove(task.id);
    expect(result).toBe(true);
    expect(taskService.getAll()).toHaveLength(0);
  });

  it('returns false for a bad id', () => {
    const result = taskService.remove('fake-id');
    expect(result).toBe(false);
  });
});

// ─────────────────────────────────────────
// completeTask()
// ─────────────────────────────────────────
describe('completeTask()', () => {
  it('sets status to done', () => {
    const task = taskService.create({ title: 'Finish Me' });
    const result = taskService.completeTask(task.id);
    expect(result.status).toBe('done');
  });

  it('sets completedAt timestamp', () => {
    const task = taskService.create({ title: 'Finish Me' });
    const result = taskService.completeTask(task.id);
    expect(result.completedAt).not.toBeNull();
  });

  it('does NOT change the original priority', () => {
    const task = taskService.create({ title: 'High Priority', priority: 'high' });
    const result = taskService.completeTask(task.id);
    expect(result.priority).toBe('high'); // will FAIL due to bug
  });

  it('returns null for a bad id', () => {
    const result = taskService.completeTask('fake-id');
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────
// getStats()
// ─────────────────────────────────────────
describe('getStats()', () => {
  it('returns zero counts when no tasks', () => {
    const stats = taskService.getStats();
    expect(stats).toEqual({ todo: 0, in_progress: 0, done: 0, overdue: 0 });
  });

  it('counts tasks by status correctly', () => {
    taskService.create({ title: 'T1', status: 'todo' });
    taskService.create({ title: 'T2', status: 'done' });
    const stats = taskService.getStats();
    expect(stats.todo).toBe(1);
    expect(stats.done).toBe(1);
  });

  it('counts overdue tasks', () => {
    taskService.create({ title: 'Overdue', status: 'todo', dueDate: '2020-01-01' });
    const stats = taskService.getStats();
    expect(stats.overdue).toBe(1);
  });

  it('does not count done tasks as overdue', () => {
    taskService.create({ title: 'Done Old', status: 'done', dueDate: '2020-01-01' });
    const stats = taskService.getStats();
    expect(stats.overdue).toBe(0);
  });
});
