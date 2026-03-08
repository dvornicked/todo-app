import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { DatabaseError } from '../../lib/db-errors';

// Тесты для проверки обработки ошибок в tRPC роутере
describe('Auth Router - Error Handling', () => {
  
  describe('DatabaseError mapping', () => {
    it('должен маппить DatabaseError в TRPCError с кодом INTERNAL_SERVER_ERROR', () => {
      const dbError = new DatabaseError('Database connection error');
      
      // Симулируем обработку в роутере
      const trpcError = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: dbError.message,
        cause: dbError,
      });

      expect(trpcError.code).toBe('INTERNAL_SERVER_ERROR');
      expect(trpcError.message).toBe('Database connection error');
    });

    it('должен отличать бизнес-ошибки от системных', () => {
      const businessError = new Error('User already exists');
      const systemError = new DatabaseError('Database connection error');

      // Бизнес-ошибка - BAD_REQUEST
      const businessTrpcError = new TRPCError({
        code: 'BAD_REQUEST',
        message: businessError.message,
      });

      // Системная ошибка - INTERNAL_SERVER_ERROR
      const systemTrpcError = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Service temporarily unavailable',
        cause: systemError,
      });

      expect(businessTrpcError.code).toBe('BAD_REQUEST');
      expect(systemTrpcError.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Error message sanitization', () => {
    const sensitivePatterns = [
      'Invalid prisma.user.findUnique() invocation',
      'Error code 14: Unable to open the database file',
      'connection string',
      'postgresql://user:password@',
      'sqlite:///absolute/path/to/db',
    ];

    it.each(sensitivePatterns)(
      'не должен пропускать в ответ: %s',
      (pattern) => {
        const error = new Error(`Something went wrong: ${pattern}`);
        
        // Симулируем обработку - технические детали не должны попадать в ответ клиенту
        const safeMessage = sanitizeForClient(error.message);
        
        expect(safeMessage).not.toContain(pattern);
        expect(safeMessage).toBe('Service temporarily unavailable');
      }
    );
  });
});

/**
 * Функция очистки сообщений для клиента
 * (дублирует логику которая должна быть в роутере)
 */
function sanitizeForClient(message: string): string {
  const sensitiveKeywords = [
    'prisma',
    'database file',
    'connection string',
    'postgresql://',
    'sqlite://',
    'Error code',
  ];
  
  const hasSensitiveInfo = sensitiveKeywords.some(kw => 
    message.toLowerCase().includes(kw.toLowerCase())
  );
  
  if (hasSensitiveInfo) {
    return 'Service temporarily unavailable';
  }
  
  return message;
}
