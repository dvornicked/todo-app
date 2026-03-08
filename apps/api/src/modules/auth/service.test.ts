import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from './service';
import { prisma } from '../../prisma';

// Мокаем Prisma
vi.mock('../../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Auth Service - Database Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('должен скрывать технические детали ошибки БД от пользователя', async () => {
      // Симулируем ошибку подключения к БД (SQLite error 14)
      const dbError = new Error(
        'Invalid `prisma.user.findUnique()` invocation:\n' +
        'Error querying the database: Error code 14: Unable to open the database file'
      );
      (prisma.user.findUnique as any).mockRejectedValue(dbError);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.toThrow('Database connection error');

      // Оригинальная ошибка не должна просочиться
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.not.toThrow('Unable to open the database file');
    });

    it('должен обрабатывать timeout ошибки БД', async () => {
      const timeoutError = new Error('Database connection timeout');
      (prisma.user.findUnique as any).mockRejectedValue(timeoutError);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.toThrow('Database connection error');
    });

    it('должен пропускать бизнес-ошибки как есть', async () => {
      // Если пользователь уже существует - это ожидаемая ошибка
      (prisma.user.findUnique as any).mockResolvedValue({
        id: '1',
        email: 'exists@example.com',
      });

      await expect(
        authService.register({
          email: 'exists@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('должен скрывать ошибки БД при логине', async () => {
      const dbError = new Error('Connection refused');
      (prisma.user.findUnique as any).mockRejectedValue(dbError);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Database connection error');
    });
  });
});
