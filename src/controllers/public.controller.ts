// src/controllers/public.controller.ts

import { Request, Response } from 'express';
import * as publicService from '../services/public.service';
import * as voteService from '../services/vote.service';
import { ApiError } from '../utils/errors';

export async function getSessionByCode(req: Request, res: Response) {
  const { joinCode } = req.params;
  const session = await publicService.getActiveSessionByCode(joinCode);
  res.status(200).json(session);
}

export async function submitVote(req: Request, res: Response) {
  const { questionId, optionId } = req.body;

  const identifier = req.ip;

  if (!identifier) {
    throw new ApiError(400, 'Could not identify voting participant.');
  }

  // Add vote to the queue
  await voteService.submitVote({
    questionId,
    optionId,
    identifier,
  });

  res.status(202).json({ message: 'Vote accepted for processing.' });
}
export async function getSessionResults(req: Request, res: Response) {
  const { joinCode } = req.params;
  const results = await publicService.getSessionResults(joinCode);
  res.status(200).json(results);
}