// src/routes/session.routes.ts

import { Router } from 'express';
import * as sessionController from '../controllers/session.controller'; // <-- THIS LINE IS FIXED
import { protectRoute } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createSessionSchema } from '../validators/session.validator';

const router = Router();

router.use(protectRoute);

// GET /api/v1/sessions
// Get all sessions for the logged-in organizer
router.get('/', sessionController.getSessions);

// POST /api/v1/sessions
// Create a new session
router.post(
  '/',
  validate(createSessionSchema),
  sessionController.createSession
);

// PATCH /api/v1/sessions/:id/start
// Start a session
router.patch('/:id/start', sessionController.startSession);

// PATCH /api/v1/sessions/:id/stop
// Stop a session
router.patch('/:id/stop', sessionController.stopSession);

export default router;