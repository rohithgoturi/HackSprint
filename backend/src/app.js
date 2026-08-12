const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const workerRoutes = require('./routes/workerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const { sendError } = require('./utils/apiResponse');

const app = express();

// Configure CORS dynamically via CLIENT_URL environment variable
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: clientUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api', healthRoutes);

// 404 Handler for unregistered routes
app.use((req, res) => {
  return sendError(res, 404, `Route ${req.originalUrl} not found`);
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
