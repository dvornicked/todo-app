import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../prisma';

export interface Context {
  req: FastifyRequest;
  res: FastifyReply;
  prisma: typeof prisma;
  user: { id: string; email: string } | null;
}

export async function createContext({
  req,
  res,
}: {
  req: FastifyRequest;
  res: FastifyReply;
}): Promise<Context> {
  return {
    req,
    res,
    prisma,
    user: null,
  };
}
