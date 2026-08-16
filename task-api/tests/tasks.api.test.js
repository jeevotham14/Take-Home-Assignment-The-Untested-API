const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

// Reset store before each test
beforeEach(() => taskService._reset());

// ─────────────────────────────────────────
// GET /tasks
// ─────────────────────────────────────────
describe('GET /tasks', () => {
  it('returns 200 and empty array when no tasks', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all tasks', async () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

// ─────────────────────────────────────────
// GET /tasks?status=
// ─────────────────────────────────────────
describe('GET /tasks?status=', () => {
  it('returns only tasks with that status', async () => {
    taskService.create({ title: 'Todo Task', status: 'todo' });
    taskService.create({ title: 'Done Task', status: 'done' });
    const res = await request(app).get('/tasks?status=todo');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Todo Task');
  });

  it('returns empty array if no tasks match status', async () => {
    taskService.create({ title: 'Todo Task', status: 'todo' });
    const res = await request(app).get('/tasks?status=done');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─────────────────────────────────────────
// GET /tasks?page=&limit=
// ─────────────────────────────────────────
describe('GET /tasks?page=&limit=', () => {
  it('returns paginated tasks', async () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });
    taskService.create({ title: 'Task 3' });
    const res = await request(app).get('/tasks?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

// ─────────────────────────────────────────
// GET /tasks/stats
// ─────────────────────────────────────────
describe('GET /tasks/stats', () => {
  it('returns 200 with zero counts when no tasks', async () => {
    const res = await request(app).get('/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ todo: 0, in_progress: 0, done: 0, overdue: 0 });
  });

  it('returns correct counts per status', async () => {
    taskService.create({ title: 'T1', status: 'todo' });
    taskService.create({ title: 'T2', status: 'done' });
    const res = await request(app).get('/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body.todo).toBe(1);
    expect(res.body.done).toBe(1);
  });

  it('counts overdue tasks', async () => {
    taskService.create({ title: 'Old Task', status: 'todo', dueDate: '2020-01-01' });
    const res = await request(app).get('/tasks/stats');
    expect(res.body.overdue).toBe(1);
  });
});

// ─────────────────────────────────────────
// POST /tasks
// ─────────────────────────────────────────
describe('POST /tasks', () => {
  it('creates a task and returns 201', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'New Task' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Task');
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 if title is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 if title is empty string', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 if status is invalid', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Task', status: 'invalid_status' });
    expect(res.status).toBe(400);
  });

  it('returns 400 if priority is invalid', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Task', priority: 'ultra' });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────
// PUT /tasks/:id
// ─────────────────────────────────────────
describe('PUT /tasks/:id', () => {
  it('updates a task and returns 200', async () => {
    const task = taskService.create({ title: 'Old Title' });
    const res = await request(app)
      .put(`/tasks/${task.id}`)
      .send({ title: 'New Title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');
  });

  it('returns 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/tasks/fake-id-999')
      .send({ title: 'Update' });
    expect(res.status).toBe(404);
  });

  it('returns 400 if title is empty string', async () => {
    const task = taskService.create({ title: 'Task' });
    const res = await request(app)
      .put(`/tasks/${task.id}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────
// DELETE /tasks/:id
// ─────────────────────────────────────────
describe('DELETE /tasks/:id', () => {
  it('deletes a task and returns 204', async () => {
    const task = taskService.create({ title: 'Delete Me' });
    const res = await request(app).delete(`/tasks/${task.id}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent task', async () => {
    const res = await request(app).delete('/tasks/fake-id-999');
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────
// PATCH /tasks/:id/complete
// ─────────────────────────────────────────
describe('PATCH /tasks/:id/complete', () => {
  it('marks task as complete and returns 200', async () => {
    const task = taskService.create({ title: 'Finish Me' });
    const res = await request(app).patch(`/tasks/${task.id}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });

  it('returns 404 for non-existent task', async () => {
    const res = await request(app).patch('/tasks/fake-id-999/complete');
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────
// PATCH /tasks/:id/assign
// ─────────────────────────────────────────
describe('PATCH /tasks/:id/assign', () => {
  it('assigns a user to a task and returns 200', async () => {
    const task = taskService.create({ title: 'Assign Me' });
    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: 'John Doe' });
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('John Doe');
  });

  it('returns the full updated task', async () => {
    const task = taskService.create({ title: 'My Task' });
    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: 'Alice' });
    expect(res.body.title).toBe('My Task');
    expect(res.body.assignee).toBe('Alice');
    expect(res.body.id).toBe(task.id);
  });

  it('returns 404 if task does not exist', async () => {
    const res = await request(app)
      .patch('/tasks/fake-id-999/assign')
      .send({ assignee: 'John' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  it('returns 400 if assignee is missing from body', async () => {
    const task = taskService.create({ title: 'Task' });
    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 if assignee is an empty string', async () => {
    const task = taskService.create({ title: 'Task' });
    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 if assignee is only whitespace', async () => {
    const task = taskService.create({ title: 'Task' });
    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: '   ' });
    expect(res.status).toBe(400);
  });

  it('trims whitespace from assignee name', async () => {
    const task = taskService.create({ title: 'Task' });
    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: '  Bob  ' });
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('Bob');
  });
});

