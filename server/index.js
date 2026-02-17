import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all users from auth.users table
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, created_at, raw_user_meta_data
      FROM auth.users
      ORDER BY created_at DESC
    `);
    
    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      username: user.raw_user_meta_data?.username || user.raw_user_meta_data?.name || null
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT id, email, created_at, raw_user_meta_data
      FROM auth.users
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      username: user.raw_user_meta_data?.username || user.raw_user_meta_data?.name || null
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Get multiple users by IDs
app.post('/api/users/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json([]);
    }
    
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(`
      SELECT id, email, created_at, raw_user_meta_data
      FROM auth.users
      WHERE id IN (${placeholders})
    `, ids);
    
    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      username: user.raw_user_meta_data?.username || user.raw_user_meta_data?.name || null
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users batch:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
