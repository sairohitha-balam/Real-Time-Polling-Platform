// src/server.ts

import app from './app';
import { env } from './config/env';
import { createServer } from 'http';
import { Server } from 'socket.io';
import IORedis from 'ioredis';
import { redisConnection } from './config/redis';

const PORT = parseInt(env.PORT, 10);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const subscriber = new IORedis(redisConnection.options);

// --- Socket.IO connection logic ---
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Listen for a client to join a session "room"
  socket.on('join_session', (joinCode) => {
    console.log(`Client ${socket.id} joining room ${joinCode}`);
    socket.join(joinCode);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

subscriber.subscribe('session-updates', (err) => {
  if (err) {
    console.error('Failed to subscribe to session-updates:', err);
  } else {
    console.log('Subscribed to session-updates channel.');
  }
});

// Handle incoming messages
subscriber.on('message', (channel, message) => {
  if (channel === 'session-updates') {
    try {
      const { joinCode } = JSON.parse(message);
      if (joinCode) {
        console.log(`Publishing update to room: ${joinCode}`);
        io.to(joinCode).emit('results_updated');
      }
    } catch (error) {
      console.error('Error parsing message from Redis:', error);
    }
  }
});

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Server (with Socket.IO) running on http://localhost:${PORT}`
  );
});