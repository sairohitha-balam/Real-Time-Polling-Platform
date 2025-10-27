// src/services/session.service.ts

import { prisma } from '../config/db';
import { ApiError } from '../utils/errors';
import { generateJoinCode } from '../utils/joinCode';

// Define the type for the createSession input (based on our validator)
interface QuestionInput {
  text: string;
  options: { text: string }[];
}

/**
 * Creates a new poll session for an organizer.
 * This uses a transaction to ensure all or nothing is created.
 */
export async function createSession(
  title: string,
  questions: QuestionInput[],
  organizerId: string
) {
  const joinCode = generateJoinCode();

  // We use a transaction to create the session, questions, and options
  // in a single, atomic operation. If any part fails, the entire
  // operation is rolled back. This ensures data consistency.
  const session = await prisma.$transaction(async (tx) => {
    const newSession = await tx.session.create({
      data: {
        title,
        joinCode,
        organizerId,
        // We create the related questions and their options in a nested write
        questions: {
          create: questions.map((q) => ({
            text: q.text,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
              })),
            },
          })),
        },
      },
      // Include the related data in the response
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
    return newSession;
  });

  return session;
}

/**
 * Starts a session, making it active for voting.
 */
export async function startSession(sessionId: string, organizerId: string) {
  // First, find the session to ensure it exists and belongs to the organizer
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new ApiError(404, 'Session not found.');
  }
  if (session.organizerId !== organizerId) {
    throw new ApiError(403, 'You are not authorized to start this session.');
  }

  // Update the session status
  const updatedSession = await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'ACTIVE' },
  });
  return updatedSession;
}

/**
 * Stops a session, closing it to new votes.
 */
export async function stopSession(sessionId: string, organizerId: string) {
  // First, find the session to ensure it exists and belongs to the organizer
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new ApiError(404, 'Session not found.');
  }
  if (session.organizerId !== organizerId) {
    throw new ApiError(403, 'You are not authorized to stop this session.');
  }

  // Update the session status
  const updatedSession = await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'STOPPED' },
  });
  return updatedSession;
}

/**
 * Gets all sessions created by a specific organizer.
 */
export async function getSessionsByOrganizer(organizerId: string) {
  return prisma.session.findMany({
    where: { organizerId },
    orderBy: { createdAt: 'desc' },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });
}