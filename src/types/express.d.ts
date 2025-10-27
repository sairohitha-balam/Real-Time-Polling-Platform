// src/types/express.d.ts

import { AuthPayload } from '../utils/jwt';

declare global {
  namespace Express {
    export interface Request {
      organizer?: AuthPayload;
    }
  }
}