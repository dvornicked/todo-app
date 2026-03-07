import { initTRPC } from '@trpc/server';
import type { Context } from './context';
import { isAuthenticated, checkTodoLimit } from './middleware';

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const limitedProcedure = t.procedure.use(isAuthenticated).use(checkTodoLimit);
