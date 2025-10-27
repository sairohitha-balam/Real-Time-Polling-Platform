// src/config/env.ts

import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.string().default('4000'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'), // <-- ADD THIS
});

// Parse and validate
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    'Invalid environment variables:',
    parsedEnv.error.format()
  );
  throw new Error('Invalid environment variables.');
}

// Export the validated environment variables
export const env = parsedEnv.data;