// src/validators/session.validator.ts

import { z } from 'zod';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text cannot be empty').max(255),
});

const questionSchema = z.object({
  text: z.string().min(1, 'Question text cannot be empty').max(1000),
  options: z
    .array(optionSchema)
    .min(2, 'Each question must have at least 2 options'),
});

export const createSessionSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Session title is required').max(255),
    questions: z
      .array(questionSchema)
      .min(1, 'A session must have at least 1 question'),
  }),
});