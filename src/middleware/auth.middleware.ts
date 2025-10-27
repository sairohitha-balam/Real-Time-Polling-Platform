// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { verifyToken } from '../utils/jwt';

export function protectRoute(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'No token provided, authorization denied.');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new ApiError(401, 'Token malformed, authorization denied.');
  }

  try {
    // 2. Verify token
    const payload = verifyToken(token);

    // 3. Attach payload to request object
    req.organizer = payload;

    // 4. Continue to the next middleware/controller
    next();
  } catch (error) {
    throw new ApiError(401, 'Token is not valid.');
  }
}