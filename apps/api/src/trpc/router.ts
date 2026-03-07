import { router } from './trpc/trpc';
import { authRouter } from './modules/auth/router';
import { todosRouter } from './modules/todos/router';
import { tagsRouter } from './modules/tags/router';

export const appRouter = router({
  auth: authRouter,
  todos: todosRouter,
  tags: tagsRouter,
});

export type AppRouter = typeof appRouter;
