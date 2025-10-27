// src/utils/jwt.ts

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
export interface AuthPayload {
  organizerId: string;
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch (error) {
    throw new Error('Invalid or expired token.');
  }
}