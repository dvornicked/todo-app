import { prisma } from '../prisma';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: {
    database: { status: 'up' | 'down'; responseTime: number; error?: string };
    api: { status: 'up' };
  };
  version?: string;
}

/**
 * Проверяет подключение к базе данных
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'up' | 'down';
  responseTime: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    // Простой запрос для проверки подключения
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: sanitizeErrorMessage(errorMessage),
    };
  }
}

/**
 * Очищает технические детали из сообщения об ошибке
 */
function sanitizeErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Скрываем внутренние детали Prisma
  if (lowerMessage.includes('unable to open') && lowerMessage.includes('database file')) {
    return 'Database file not accessible';
  }
  if (lowerMessage.includes('connection refused') || lowerMessage.includes('econnrefused')) {
    return 'Database connection refused';
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('etimedout')) {
    return 'Database connection timeout';
  }
  if (lowerMessage.includes('database is locked')) {
    return 'Database is busy';
  }
  
  // Для остальных ошибок - общее сообщение
  return 'Database error';
}

/**
 * Получает полный статус здоровья системы
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const dbCheck = await checkDatabaseHealth();
  
  const overallStatus: HealthStatus['status'] = 
    dbCheck.status === 'up' ? 'healthy' : 'unhealthy';
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks: {
      database: dbCheck,
      api: { status: 'up' },
    },
    version: process.env.npm_package_version || '1.0.0',
  };
}
