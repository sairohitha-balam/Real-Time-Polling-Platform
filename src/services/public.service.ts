// src/services/public.service.ts

import { prisma } from '../config/db';
import { ApiError } from '../utils/errors';

export async function getActiveSessionByCode(joinCode: string) {
  const session = await prisma.session.findFirst({
    where: {
      joinCode: joinCode.toUpperCase(),
      status: 'ACTIVE',
    },
    include: {
      questions: {
        // orderBy: { createdAt: 'asc' }, // Or however you want to order them
        include: {
          options: {
            // orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              text: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new ApiError(404, 'No active session found with this code.');
  }

  return session;
}
export async function getSessionResults(joinCode: string) {
  const session = await prisma.session.findFirst({
    where: {
      joinCode: joinCode.toUpperCase(),
    },
    include: {
      questions: {
        include: {
          options: {
            select: {
              id: true,
              text: true,
              votes: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new ApiError(404, 'Session not found with this code.');
  }

  return {
    title: session.title,
    status: session.status,
    questions: session.questions,
  };
}