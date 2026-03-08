import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../../trpc/trpc';
import { loginSchema } from '@todo/shared';
import * as authService from './service';
import { DatabaseError } from '../../lib/db-errors';

/**
 * Преобразует ошибку в TRPCError с корректным кодом
 */
function handleAuthError(error: unknown): never {
  if (error instanceof DatabaseError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Service temporarily unavailable. Please try again later.',
    });
  }
  
  throw error;
}

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        confirmPassword: z.string().min(8),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
      })
    )
    .mutation(async ({ input }) => {
      try {
        const user = await authService.register({
          email: input.email,
          password: input.password,
          confirmPassword: input.confirmPassword,
        });
        return { success: true, user };
      } catch (error) {
        // Проверяем системные ошибки (БД) - скрываем детали
        if (error instanceof DatabaseError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Service temporarily unavailable. Please try again later.',
          });
        }
        
        // Бизнес-логика ошибок
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Registration failed',
        });
      }
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.login(input);

        ctx.res.setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        });

        return {
          success: true,
          user: result.user,
          accessToken: result.accessToken,
        };
      } catch (error) {
        // Проверяем системные ошибки (БД)
        if (error instanceof DatabaseError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Service temporarily unavailable. Please try again later.',
          });
        }
        
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error instanceof Error ? error.message : 'Login failed',
        });
      }
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const tokens = await authService.refreshTokens(input.refreshToken);

        ctx.res.setCookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        });

        return { accessToken: tokens.accessToken };
      } catch {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }
    }),

  logout: protectedProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authService.logout(ctx.user!.id, input.refreshToken);
      ctx.res.clearCookie('refreshToken', { path: '/' });
      return { success: true };
    }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
