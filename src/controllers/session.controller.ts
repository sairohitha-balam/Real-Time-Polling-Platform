// src/controllers/session.controller.ts

import { Request, Response } from 'express';
import * as sessionService from '../services/session.service';

export async function createSession(req: Request, res: Response) {
  const { title, questions } = req.body;
  const organizerId = req.organizer!.organizerId;

  const session = await sessionService.createSession(
    title,
    questions,
    organizerId
  );
  res.status(201).json(session);
}

export async function startSession(req: Request, res: Response) {
  const { id } = req.params;
  const organizerId = req.organizer!.organizerId;

  const session = await sessionService.startSession(id, organizerId);
  res.status(200).json(session);
}

export async function stopSession(req: Request, res: Response) {
  const { id } = req.params;
  const organizerId = req.organizer!.organizerId;

  const session = await sessionService.stopSession(id, organizerId);
  res.status(200).json(session);
}

export async function getSessions(req: Request, res: Response) {
  const organizerId = req.organizer!.organizerId;
  const sessions = await sessionService.getSessionsByOrganizer(organizerId);
  res.status(200).json(sessions);
}