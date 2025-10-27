// src/app.ts

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/session.routes';
import publicRoutes from './routes/public.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// --- Core Middlewares ---
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.set('trust proxy', 1);

// --- API Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/public', publicRoutes);

// --- Health Check Route ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// --- Error Handling Middleware ---
app.use(errorHandler);

export default app;