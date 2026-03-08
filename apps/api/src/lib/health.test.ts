import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDatabaseHealth, getHealthStatus } from './health';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('Health Check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDatabaseHealth', () => {
    it('должен возвращать status up при рабочей БД', async () => {
      (prisma.$queryRaw as any).mockResolvedValue([{ 1: 1 }]);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('up');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('должен возвращать status down при ошибке "Unable to open the database file"', async () => {
      const dbError = new Error(
        'Invalid prisma.user.findUnique() invocation: ' +
        'Error code 14: Unable to open the database file'
      );
      (prisma.$queryRaw as any).mockRejectedValue(dbError);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('down');
      expect(result.error).toBe('Database file not accessible');
      // Технические детали не должны просочиться
      expect(result.error).not.toContain('Unable to open');
      expect(result.error).not.toContain('prisma');
    });

    it('должен скрывать технические детали ошибки connection refused', async () => {
      const dbError = new Error('connect ECONNREFUSED 127.0.0.1:5432');
      (prisma.$queryRaw as any).mockRejectedValue(dbError);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('down');
      expect(result.error).toBe('Database connection refused');
    });

    it('должен обрабатывать timeout ошибки', async () => {
      const dbError = new Error('Connection timeout after 30000ms');
      (prisma.$queryRaw as any).mockRejectedValue(dbError);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('down');
      expect(result.error).toBe('Database connection timeout');
    });

    it('должен измерять время отклика', async () => {
      (prisma.$queryRaw as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([{ 1: 1}]), 50))
      );

      const result = await checkDatabaseHealth();

      expect(result.responseTime).toBeGreaterThanOrEqual(50);
    });
  });

  describe('getHealthStatus', () => {
    it('должен возвращать healthy когда БД работает', async () => {
      (prisma.$queryRaw as any).mockResolvedValue([{ 1: 1 }]);

      const result = await getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.checks.database.status).toBe('up');
      expect(result.checks.api.status).toBe('up');
      expect(result.timestamp).toBeDefined();
    });

    it('должен возвращать unhealthy когда БД недоступна', async () => {
      const dbError = new Error('Unable to open the database file');
      (prisma.$queryRaw as any).mockRejectedValue(dbError);

      const result = await getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('down');
      expect(result.checks.database.error).toBe('Database file not accessible');
    });

    it('должен включать версию приложения', async () => {
      (prisma.$queryRaw as any).mockResolvedValue([{ 1: 1 }]);
      const originalVersion = process.env.npm_package_version;
      process.env.npm_package_version = '1.2.3';

      const result = await getHealthStatus();

      expect(result.version).toBe('1.2.3');
      
      process.env.npm_package_version = originalVersion;
    });
  });
});
