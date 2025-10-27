// src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  const organizer = await authService.register(email, password);
  res.status(201).json(organizer);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json(result);
}