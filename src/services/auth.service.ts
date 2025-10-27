// src/services/auth.service.ts

import { prisma } from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/errors';

export async function register(email: string, password: string) {
  // 1. Check if user already exists
  const existingUser = await prisma.organizer.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'An organizer with this email already exists.');
  }

  // 2. Hash password
  const hashedPassword = await hashPassword(password);

  // 3. Create user
  const organizer = await prisma.organizer.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  // 4. Don't return the password
  const { password: _, ...organizerWithoutPassword } = organizer;
  return organizerWithoutPassword;
}

export async function login(email: string, password: string) {
  // 1. Find user
  const organizer = await prisma.organizer.findUnique({ where: { email } });
  if (!organizer) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // 2. Compare password
  const isPasswordValid = await comparePassword(password, organizer.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // 3. Sign and return token
  const token = signToken({ organizerId: organizer.id });
  return { token };
}