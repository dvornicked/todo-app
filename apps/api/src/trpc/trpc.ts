import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';
import type { Context } from './context';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Auth middleware
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  const token = ctx.req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    return next({
      ctx: {
        ...ctx,
        user: { id: decoded.userId, email: decoded.email },
      },
    });
  } catch {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid token' });
  }
});

// Todo limit middleware
const checkTodoLimit = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }

  const count = await ctx.prisma.todo.count({
    where: { userId: ctx.user.id },
  });

  if (count >= 200) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message:
        'You have reached the maximum of 200 todos. Delete or archive old todos to create new ones.',
    });
  }

  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);
export const limitedProcedure = t.procedure.use(isAuthenticated).use(checkTodoLimit);
