import express from 'express';
import { z } from 'zod';
import { 
  getTodos, 
  createTodo, 
  updateTodo, 
  deleteTodo,
  countUserTodos
} from '../config/database.js';
import { authenticateToken, checkTodoLimit } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createTodoSchema = z.object({
  text: z.string().min(1, 'Text is required').max(500, 'Text too long (max 500 chars)')
});

const updateTodoSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(500, 'Text too long').optional(),
  completed: z.boolean().optional()
}).refine(data => data.text !== undefined || data.completed !== undefined, {
  message: 'At least one field (text or completed) must be provided'
});

// GET /api/todos - Get all todos for user
router.get('/', async (req, res) => {
  try {
    const todos = await getTodos(req.userId);
    const count = await countUserTodos(req.userId);
    
    res.json({
      todos: todos.map(t => ({
        id: t.id,
        text: t.text,
        completed: Boolean(t.completed),
        createdAt: t.created_at
      })),
      count,
      limit: 200
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /api/todos - Create new todo (with limit check)
router.post('/', checkTodoLimit(), async (req, res) => {
  try {
    // Validate input
    const result = createTodoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    const { text } = result.data;
    const todo = await createTodo(req.userId, text.trim());
    
    res.status(201).json({
      id: todo.id,
      text: todo.text,
      completed: Boolean(todo.completed),
      createdAt: todo.created_at
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PATCH /api/todos/:id - Update todo
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate input
    const result = updateTodoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    const updates = {};
    if (result.data.text !== undefined) {
      updates.text = result.data.text.trim();
    }
    if (result.data.completed !== undefined) {
      updates.completed = result.data.completed;
    }

    const todo = await updateTodo(req.userId, id, updates);
    
    res.json({
      id: todo.id,
      text: todo.text,
      completed: todo.completed
    });
  } catch (error) {
    if (error.message === 'Todo not found or access denied') {
      return res.status(404).json({ error: 'Todo not found' });
    }
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id - Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTodo(req.userId, id);
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Todo not found or access denied') {
      return res.status(404).json({ error: 'Todo not found' });
    }
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
