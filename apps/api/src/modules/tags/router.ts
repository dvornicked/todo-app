import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/trpc';

export const tagsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.tag.findMany({
      where: { userId: ctx.user!.id },
      orderBy: { name: 'asc' },
    });
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
        return await ctx.prisma.tag.create({
          data: {
            ...input,
            userId: ctx.user!.id,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tag with this name already exists',
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
      const { id, ...data } = input;
      const tag = await ctx.prisma.tag.findFirst({
        where: { id, userId: ctx.user!.id },
      });

      if (!tag) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tag not found' });
      }

      return ctx.prisma.tag.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tag = await ctx.prisma.tag.findFirst({
        where: { id, userId: ctx.user!.id },
      });

      if (!tag) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tag not found' });
      }

      await ctx.prisma.tag.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
