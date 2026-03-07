import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MAX_TODOS_PER_USER = 200;

// Generate JWT token
export function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = user.userId;
    req.userEmail = user.email;
    next();
  });
}

// Check todo limit middleware
export function checkTodoLimit(db) {
  return async (req, res, next) => {
    try {
      const { countUserTodos } = await import('../config/database.js');
      const currentCount = await countUserTodos(req.userId);
      
      if (currentCount >= MAX_TODOS_PER_USER) {
        return res.status(429).json({
          error: 'Limit exceeded',
          message: `Maximum ${MAX_TODOS_PER_USER} todos allowed per user`,
          current: currentCount,
          limit: MAX_TODOS_PER_USER
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking todo limit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export { JWT_SECRET };
