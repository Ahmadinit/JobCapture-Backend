const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const jobsRoutes = require('./routes/jobsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const metaRoutes = require('./routes/metaRoutes');
const trackRoutes = require('./routes/trackRoutes');
const companiesRoutes = require('./routes/companiesRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

app.get('/', (req, res) => {
  res.json({
    service: 'JobCapture Backend API',
    status: 'online',
    frontend: 'http://localhost:5173',
    endpoints: {
      health: '/api/health',
      jobs: '/api/jobs',
      facets: '/api/jobs/facets',
    },
  });
});

app.get('/api/health', async (req, res) => {
  const readyState = mongoose.connection.readyState;
  const isHealthy = readyState === 1;
  let pingMs = null;

  if (isHealthy && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - start;
    } catch {
      // ping failed
    }
  }

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    error: !isHealthy,
    database: {
      status: DB_STATES[readyState] || 'unknown',
      name: mongoose.connection.name || null,
      pingMs,
    },
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/t', trackRoutes);
app.use('/api/companies', companiesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
