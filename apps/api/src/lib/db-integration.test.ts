import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkDatabaseHealth } from './health';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

/**
 * Интеграционные тесты для проверки поведения системы
 * при различных проблемах с базой данных
 */
describe('Database Connection Integration Tests', () => {
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Подавляем console.error во время тестов
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('SQLite-specific errors', () => {
    it('должен обрабатывать ошибку "database is locked"', async () => {
      const lockedError = new Error('database is locked (5) (SQLITE_BUSY)');
      (prisma.$queryRaw as any).mockRejectedValue(lockedError);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('down');
      expect(result.error).toBe('Database is busy');
    });

    it('должен обрабатывать ошибку "no such table"', async () => {
      const tableError = new Error(
        'The table main.User does not exist in the current database.'
      );
      (prisma.$queryRaw as any).mockRejectedValue(tableError);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('down');
      // Это тоже системная ошибка - таблицы не существует (миграции не применены)
      expect(result.error).toBe('Database error');
    });

    it('должен обрабатывать ошибку доступа к файлу БД', async () => {
      const permissionError = new Error(
        'unable to open database file (14) - SQLITE_CANTOPEN'
      );
      (prisma.$queryRaw as any).mockRejectedValue(permissionError);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('down');
      expect(result.error).toBe('Database file not accessible');
    });

    it('должен обрабатывать ошибку "disk I/O error"', async () => {
      const ioError = new Error('disk I/O error (10) (SQLITE_IOERR)');
      (prisma.$queryRaw as any).mockRejectedValue(ioError);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('down');
      expect(result.error).toBe('Database error');
    });
  });

  describe('Connection lifecycle', () => {
    it('должен корректно измерять время при медленном ответе БД', async () => {
      (prisma.$queryRaw as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([{ 1: 1}]), 200))
      );

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('up');
      expect(result.responseTime).toBeGreaterThanOrEqual(200);
    });

    it('должен обрабатывать abort/timeout запроса', async () => {
      const abortError = new Error('Query execution was interrupted');
      (prisma.$queryRaw as any).mockRejectedValue(abortError);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('down');
      expect(result.error).toBeDefined();
    });
  });

  describe('Error logging', () => {
    it('должен возвращать информацию об ошибке без технических деталей', async () => {
      const fullError = new Error(
        'Invalid prisma.user.findUnique() invocation:\n' +
        'Error querying the database: Error code 14: Unable to open the database file\n' +
        'at /app/node_modules/@prisma/client/runtime/library.js:123:45'
      );
      (prisma.$queryRaw as any).mockRejectedValue(fullError);

      const result = await checkDatabaseHealth();

      // Проверяем что технические детали не попали в ответ
      expect(result.error).toBe('Database file not accessible');
      expect(result.error).not.toContain('prisma');
      expect(result.error).not.toContain('Unable to open');
    });
  });
});

/**
 * Тесты для проверки graceful degradation
 */
describe('Graceful Degradation', () => {
  it('должен предоставлять fallback статус когда БД недоступна', async () => {
    const dbError = new Error('Connection failed');
    (prisma.$queryRaw as any).mockRejectedValue(dbError);

    const { getHealthStatus } = await import('./health.js');
    const status = await getHealthStatus();

    // API может быть доступен даже если БД нет
    expect(status.checks.api.status).toBe('up');
    expect(status.checks.database.status).toBe('down');
    expect(status.status).toBe('unhealthy');
  });
});
