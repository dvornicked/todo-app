/**
 * Утилита для обработки ошибок базы данных.
 * Скрывает технические детали от пользователя, логирует для мониторинга.
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Проверяет, является ли ошибка ошибкой подключения к БД
 */
function isConnectionError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const connectionErrors = [
    'unable to open the database file',
    'connection refused',
    'connection timeout',
    'database is locked',
    'disk i/o error',
    'no such table',
    'invalid prisma',
    'error querying the database',
  ];
  
  return connectionErrors.some(pattern => message.includes(pattern));
}

/**
 * Оборачивает ошибку БД в безопасное сообщение для пользователя
 */
export function handleDatabaseError(error: unknown, context: string): never {
  const originalError = error instanceof Error ? error : new Error(String(error));
  
  // Логируем полную ошибку для мониторинга (в реальном приложении - в лог-сервис)
  console.error(`[DB Error in ${context}]:`, originalError);
  
  // Если это ошибка подключения - скрываем детали
  if (isConnectionError(originalError)) {
    throw new DatabaseError(
      'Database connection error. Please try again later.',
      originalError,
      'DB_CONNECTION_ERROR'
    );
  }
  
  // Пробрасываем остальные ошибки как есть (они могут быть бизнес-ошибками)
  throw originalError;
}

/**
 * Обёртка для безопасного выполнения запросов к БД
 */
export async function withDbErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleDatabaseError(error, context);
  }
}
