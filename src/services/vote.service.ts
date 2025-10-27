// src/services/vote.service.ts

import { voteQueue } from '../config/redis';
import { ApiError } from '../utils/errors';
import { prisma } from '../config/db';

export interface VoteJobData {
  questionId: string;
  optionId: string;
  identifier: string;
}

export async function submitVote(data: VoteJobData) {
  const option = await prisma.option.findFirst({
    where: {
      id: data.optionId,
      questionId: data.questionId,
    },
  });

  if (!option) {
    throw new ApiError(400, 'Invalid vote. Option does not match question.');
  }

  await voteQueue.add('process-vote', data, {
    jobId: `${data.identifier}-${data.questionId}`,
  });
}