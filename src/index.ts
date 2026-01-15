import express from 'express';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import next from 'next';

// Load environment variables
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  // Middleware
  server.use(express.json());

  // Initialize Turso client
  let db: any = null;
  try {
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
      db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      console.log('✅ Turso database connected successfully');
    } else {
      console.warn('⚠️  Turso environment variables not set');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Turso:', error);
  }

  // API endpoint for BTR calculations
  server.post('/api/btr-calculate', async (req, res) => {
    try {
      const { birthData, lifeEvents } = req.body;

      // Basic validation
      if (!birthData || !lifeEvents) {
        return res.status(400).json({ error: 'Missing required data' });
      }

      // Here you would integrate your BTR engine logic
      // For now, returning a mock response
      const result = {
        status: 'success',
        message: 'BTR calculation endpoint ready',
        data: {
          birthData,
          lifeEvents,
          timestamp: new Date().toISOString()
        }
      };

      res.json(result);
    } catch (error) {
      console.error('BTR calculation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Database test endpoint
  server.get('/api/test-db', async (req, res) => {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    try {
      const result = await db.execute('SELECT 1 as test');
      res.json({ status: 'Database connection successful', result });
    } catch (error) {
      console.error('Database test error:', error);
      res.status(500).json({ error: 'Database test failed' });
    }
  });

  // Default handler for Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err?: any) => {
    if (err) throw err;
    console.log(`🚀 AI-Pandit BTR Engine running on port ${PORT}`);
    console.log(`📊 Memory limit: 180MB (optimized for Northflank 256MB tier)`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
