// src/workers/vote.worker.ts

import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/db';
import { VoteJobData } from '../services/vote.service';
import IORedis from 'ioredis';

const publisher = new IORedis(redisConnection.options);

const voteWorker = new Worker(
  'vote-queue', 
  async (job: Job<VoteJobData>) => {
    const { questionId, optionId, identifier } = job.data;

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Check if this user has already voted for this question
        const existingVote = await tx.voteRecord.findUnique({
          where: {
            identifier_questionId: {
              identifier,
              questionId,
            },
          },
        });

        // If they've already voted, we stop here. The job is "successful" (we processed it).
        if (existingVote) {
          console.log(`Duplicate vote blocked: ${identifier} for ${questionId}`);
          return;
        }

        // 2. If no existing vote, we record the new vote
        await tx.voteRecord.create({
          data: {
            identifier,
            questionId,
          },
        });

        // 3. And increment the vote count for the option
        await tx.option.update({
          where: { id: optionId },
          data: {
            votes: {
              increment: 1,
            },
          },
        });
        // 4. After the vote is successfully counted, publish an update.
        // We need the session's joinCode to do this.
        const option = await tx.option.findUnique({
          where: { id: optionId },
          include: {
            question: {
              include: {
                session: {
                  select: { joinCode: true },
                },
              },
            },
          },
        });

        if (option) {
          const joinCode = option.question.session.joinCode;
          await publisher.publish(
            'session-updates',
            JSON.stringify({ joinCode })
          );
        }
      });
    } catch (error) {
      console.error('Error processing vote job:', error);
      throw error;
    }
  },
  { connection: redisConnection }
);

voteWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

voteWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`);
});

console.log('Vote worker started and listening for jobs... 🚀');