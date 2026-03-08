# Тесты для обработки ошибок базы данных

## Проблема

На скриншоте видно, что при недоступной базе данных (SQLite error 14: Unable to open the database file) пользователю показывается техническая ошибка Prisma:

```
Invalid prisma.user.findUnique() invocation:
Error querying the database: Error code 14: Unable to open the database file
```

Это:
1. Утечка внутренних деталей реализации (Prisma, SQL)
2. Непонятно для конечного пользователя
3. Потенциальная угроза безопасности (раскрытие структуры БД)

## Решение

### 1. Обработка ошибок БД (`src/lib/db-errors.ts`)

```typescript
// Скрываем технические детали, показываем понятное сообщение
throw new DatabaseError('Database connection error. Please try again later.');
```

**Тесты:** `src/modules/auth/service.test.ts`
- Проверяют что ошибки БД заменяются на безопасные сообщения
- Бизнес-ошибки ("User already exists") пропускаются как есть

### 2. Health Check с проверкой БД (`src/lib/health.ts`)

```typescript
GET /health
// Ответ при проблемах:
{
  "status": "unhealthy",
  "checks": {
    "database": { "status": "down", "error": "Database file not accessible" },
    "api": { "status": "up" }
  }
}
```

**Тесты:** `src/lib/health.test.ts`, `src/lib/db-integration.test.ts`
- Проверяют все типы ошибок SQLite (locked, I/O error, no such table)
- Ошибки очищаются от технических деталей
- Измеряется время отклика БД

### 3. Graceful Error Handling в API

**Обновления:**
- `src/index.ts` — глобальный обработчик ошибок с поддержкой `DatabaseError`
- `src/modules/auth/router.ts` — маппинг ошибок БД в HTTP 503

## Запуск тестов

```bash
cd apps/api
npm install  # установит vitest
npm run test

# С coverage
npm run test -- --coverage
```

## Структура тестов

```
src/
├── lib/
│   ├── db-errors.ts           # Утилиты для обработки ошибок БД
│   ├── db-errors.test.ts      # (опционально) тесты утилит
│   ├── health.ts              # Health check с проверкой БД
│   ├── health.test.ts         # Тесты health check
│   └── db-integration.test.ts # Интеграционные тесты БД
└── modules/auth/
    ├── service.ts             # Обновлён с обработкой ошибок
    ├── service.test.ts        # Тесты сервиса аутентификации
    ├── router.ts              # Обновлён с маппингом ошибок
    └── router.test.ts         # Тесты роутера
```

## Результат

При ошибке БД пользователь теперь видит:
```
Service temporarily unavailable. Please try again later.
```

Вместо:
```
Invalid prisma.user.findUnique() invocation: Error code 14...
```

## Мониторинг

Health check endpoint (`/health`) позволяет мониторингу:
- Отслеживать доступность БД
- Получать метрики времени отклика
- Настраивать алерты при `status: "unhealthy"`
