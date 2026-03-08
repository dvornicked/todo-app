import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/trpc';
import * as tagService from './service';
import { DatabaseError } from '../../lib/db-errors';

export const tagsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return tagService.getTags(ctx.user!.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await tagService.createTag(ctx.user!.id, input);
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Service temporarily unavailable',
          });
        }
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to create tag',
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await tagService.updateTag(ctx.user!.id, input.id, {
          name: input.name,
          color: input.color,
        });
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Service temporarily unavailable',
          });
        }
        if (error instanceof Error && error.message === 'Tag not found') {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Tag not found' });
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await tagService.deleteTag(ctx.user!.id, input.id);
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Service temporarily unavailable',
          });
        }
        if (error instanceof Error && error.message === 'Tag not found') {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Tag not found' });
        }
        throw error;
      }
    }),
});
