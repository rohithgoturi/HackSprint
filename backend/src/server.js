require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

/**
 * Start Server after establishing database connection
 */
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Express listener only after successful database connection
    const server = app.listen(PORT, () => {
      console.log(`[Server] Listening in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Handle unhandled rejections cleanly
    process.on('unhandledRejection', (err) => {
      console.error(`[Process] Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error(`[Server Startup Failed]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
