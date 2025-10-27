// src/validators/public.validator.ts

import { z } from 'zod';

export const getSessionByCodeSchema = z.object({
  params: z.object({
    joinCode: z.string().length(6, 'Join code must be 6 characters'),
  }),
});

export const submitVoteSchema = z.object({
  body: z.object({
    questionId: z.string().cuid('Invalid question ID'),
    optionId: z.string().cuid('Invalid option ID'),
  }),
});