// src/index.js (restarting to apply attendance fixes)
import 'dotenv/config';
import { env } from './config/env.js'; // restart trigger
import app from './app.js';
import { connectDB } from './db/connect.js';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { initializeSocket } from './socket/index.js';
import { initTelegramBot } from './services/telegram.service.js';

const PORT = env.port;
let server;
let httpServer;

async function main() {
  await connectDB();

  // Create HTTP server
  httpServer = createServer(app);

  // Initialize Socket.IO
  initializeSocket(httpServer);

  // Initialize Telegram Bot
  initTelegramBot();

  // Start server
  server = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ API listening on port ${PORT}`);
    console.log(`✅ WebSocket server initialized`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`❌ Port ${PORT} already in use`);
    else console.error(err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('❌ Startup failed', err);
  process.exit(1);
});

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
