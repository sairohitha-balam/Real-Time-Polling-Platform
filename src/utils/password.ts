// src/utils/password.ts

import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return await hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hashed: string) {
  return await compare(password, hashed);
}