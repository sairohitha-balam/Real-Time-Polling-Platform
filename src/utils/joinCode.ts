// src/utils/joinCode.ts

import { customAlphabet } from 'nanoid';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET, 6);

export function generateJoinCode() {
  return nanoid();
}