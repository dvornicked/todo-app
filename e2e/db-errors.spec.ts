import { test, expect } from '@playwright/test';

/**
 * E2E тесты для проверки обработки ошибок базы данных
 * Эти тесты проверяют, что пользователь НЕ видит технические детали ошибок
 */

test.describe('Database Error Handling', () => {
  
  test('регистрация не должна показывать технические детали ошибки БД', async ({ page }) => {
    await page.goto('/register');
    
    // Заполняем форму регистрации
    await page.getByLabel(/email/i).fill('test-e2e@example.com');
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByLabel(/confirm password/i).fill('SecurePass123!');
    
    // Отправляем форму
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    
    // Проверяем что НЕТ технических деталей
    const pageContent = await page.content();
    
    // Не должно быть упоминаний Prisma
    expect(pageContent).not.toContain('prisma');
    expect(pageContent).not.toContain('Prisma');
    
    // Не должно быть SQL ошибок
    expect(pageContent).not.toContain('SQLite');
    expect(pageContent).not.toContain('SQLITE');
    expect(pageContent).not.toContain('database file');
    expect(pageContent).not.toContain('Unable to open');
    
    // Не должно быть stack trace
    expect(pageContent).not.toContain('findUnique');
    expect(pageContent).not.toContain('invocation');
    expect(pageContent).not.toContain('Error code 14');
    expect(pageContent).not.toContain('Error querying');
    
    // Либо успешная регистрация, либо понятное сообщение об ошибке
    const hasSuccess = await page.getByText(/success|welcome|account created/i).isVisible().catch(() => false);
    const hasError = await page.getByText(/unavailable|try again|error/i).isVisible().catch(() => false);
    
    expect(hasSuccess || hasError).toBeTruthy();
  });

  test('логин не должен показывать технические детали ошибки БД', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login|log in/i }).click();
    
    const pageContent = await page.content();
    
    // Проверяем отсутствие технических деталей
    expect(pageContent).not.toContain('prisma');
    expect(pageContent).not.toContain('Prisma');
    expect(pageContent).not.toContain('SQLite');
    expect(pageContent).not.toContain('database file');
    expect(pageContent).not.toContain('Unable to open');
    expect(pageContent).not.toContain('findUnique');
    expect(pageContent).not.toContain('Error code');
  });

  test('health endpoint должен возвращать корректный статус', async ({ request }) => {
    const response = await request.get('/api/health');
    
    // Должен быть 200 или 503 (оба валидны)
    expect([200, 503]).toContain(response.status());
    
    const body = await response.json();
    
    // Проверяем структуру ответа
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('checks');
    
    // Не должно быть технических деталей в ошибках
    const responseText = JSON.stringify(body);
    expect(responseText).not.toContain('prisma');
    expect(responseText).not.toContain('Prisma');
    expect(responseText).not.toContain('SQLite');
    expect(responseText).not.toContain('Unable to open');
  });
});

test.describe('API Error Handling', () => {
  
  test('API не должен возвращать технические детали ошибок БД', async ({ request }) => {
    // Пытаемся сделать запрос к API
    const response = await request.post('/api/trpc/auth.register', {
      data: {
        email: 'test-api@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      },
    });
    
    // Получаем текст ответа
    const responseText = await response.text();
    
    // Проверяем что нет технических деталей
    expect(responseText).not.toContain('prisma');
    expect(responseText).not.toContain('Prisma');
    expect(responseText).not.toContain('SQLite');
    expect(responseText).not.toContain('database file');
    expect(responseText).not.toContain('Unable to open');
    expect(responseText).not.toContain('findUnique');
    expect(responseText).not.toContain('Error code 14');
    expect(responseText).not.toContain('Error querying');
    expect(responseText).not.toContain('invocation');
  });
});
