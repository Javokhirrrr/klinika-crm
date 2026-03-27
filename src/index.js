// src/index.js
import 'dotenv/config';
import { env } from './config/env.js';
import app from './app.js';
import { connectDB } from './db/connect.js';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { initializeSocket } from './socket/index.js';
import { initTelegramBot } from './services/telegram.service.js';
import { startQueueCleanupJob } from './jobs/queueCleanup.js';

const PORT = env.port;
let server;
let httpServer;

async function main() {
  try {
    console.log('⏳ Starting application...');
    console.log('📌 Environment:', process.env.NODE_ENV);
    console.log('📌 Port:', PORT);

    console.log('⏳ Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected');

    // Create HTTP server
    httpServer = createServer(app);

    // Initialize Socket.IO
    console.log('⏳ Initializing Socket.IO...');
    initializeSocket(httpServer);
    console.log('✅ Socket.IO initialized');

    // Initialize Telegram Bot
    console.log('⏳ Initializing Telegram Bot...');
    await initTelegramBot();
    console.log('✅ Telegram Bot initialized');

    // Start server
    console.log('⏳ Starting HTTP server...');
    server = httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ API listening on port ${PORT}`);
      console.log(`✅ WebSocket server initialized`);
      // ✅ Avtomatik navbat tozalash (har kuni tunda)
      startQueueCleanupJob();
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') console.error(`❌ Port ${PORT} already in use`);
      else console.error('❌ Server error:', err);
      process.exit(1);
    });

  } catch (err) {
    console.error('❌ Startup CRASH:', err);
    process.exit(1);
  }
}

main();

// Export for Vercel
export default app;

async function shutdown() {
  try {
    if (server) await new Promise((r) => server.close(r));
    await mongoose.connection.close();
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
