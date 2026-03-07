import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, limitedProcedure } from '../../trpc/trpc';
import { todoFiltersSchema, createTodoSchema, updateTodoSchema } from '@todo/shared';
import * as todoService from './service';

export const todosRouter = router({
  list: protectedProcedure
    .input(todoFiltersSchema)
    .query(async ({ ctx, input }) => {
      return todoService.getTodos(ctx.user!.id, input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const todo = await todoService.getTodoById(ctx.user!.id, input.id);
      if (!todo) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found' });
      }
      return todo;
    }),

  create: limitedProcedure
    .input(createTodoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await todoService.createTodo(ctx.user!.id, input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create todo',
        });
      }
    }),

  update: protectedProcedure
    .input(updateTodoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await todoService.updateTodo(ctx.user!.id, input);
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: error instanceof Error ? error.message : 'Todo not found',
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await todoService.deleteTodo(ctx.user!.id, input.id);
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: error instanceof Error ? error.message : 'Todo not found',
        });
      }
    }),

  count: protectedProcedure.query(async ({ ctx }) => {
    return todoService.getTodoCount(ctx.user!.id);
  }),
});
