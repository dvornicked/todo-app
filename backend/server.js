import express from 'express';
import cors from 'cors';
import { initDatabase, closeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import todosRoutes from './routes/todos.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todosRoutes);

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'This is a protected route',
    userId: req.userId,
    email: req.userEmail
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized');
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API endpoints:`);
      console.log(`  POST /api/auth/register - Register new user`);
      console.log(`  POST /api/auth/login - Login user`);
      console.log(`  GET  /api/todos - Get all todos (JWT required)`);
      console.log(`  POST /api/todos - Create todo (JWT required)`);
      console.log(`  PATCH /api/todos/:id - Update todo (JWT required)`);
      console.log(`  DELETE /api/todos/:id - Delete todo (JWT required)`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await closeDatabase();
        console.log('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await closeDatabase();
        console.log('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
