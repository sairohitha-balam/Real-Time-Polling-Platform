// src/routes/public.routes.ts

import { Router } from 'express';
import * as publicController from '../controllers/public.controller';
import { validate } from '../middleware/validate.middleware';
import {
  getSessionByCodeSchema,
  submitVoteSchema,
} from '../validators/public.validator';

const router = Router();

// GET /api/v1/public/sessions/:joinCode
// Get the questions and options for an active session
router.get(
  '/sessions/:joinCode',
  validate(getSessionByCodeSchema),
  publicController.getSessionByCode
);

// POST /api/v1/public/vote
// Submit a vote for a question
router.post('/vote', validate(submitVoteSchema), publicController.submitVote);
router.get(
  '/results/:joinCode',
  validate(getSessionByCodeSchema), // the same validator can be reused
  publicController.getSessionResults
);
export default router;