import { test, expect } from '@playwright/test';

/**
 * E2E тесты для основного функционала Todo App
 */

test.describe('User Registration', () => {
  
  test('успешная регистрация нового пользователя', async ({ page }) => {
    await page.goto('/register');
    
    // Уникальный email для теста
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByLabel(/confirm password/i).fill('SecurePass123!');
    
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    
    // Ждём редирект на главную или сообщение об успехе
    await expect(page).toHaveURL(/\/$/, { timeout: 5000 });
    
    // Проверяем что пользователь залогинен
    await expect(page.getByText(/logout|sign out|welcome/i)).toBeVisible();
  });

  test('ошибка при повторной регистрации с тем же email', async ({ page }) => {
    await page.goto('/register');
    
    const email = `duplicate-${Date.now()}@example.com`;
    
    // Первая регистрация
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByLabel(/confirm password/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page).toHaveURL(/\/$/, { timeout: 5000 });
    
    // Выходим
    await page.getByRole('button', { name: /logout|sign out/i }).click();
    
    // Пытаемся зарегистрироваться снова
    await page.goto('/register');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByLabel(/confirm password/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Должна быть ошибка
    await expect(page.getByText(/already exists|user already|account exists/i)).toBeVisible();
  });

  test('валидация пароля - минимум 8 символов', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel(/email/i).fill('test-validation@example.com');
    await page.getByLabel(/password/i).fill('12345');
    await page.getByLabel(/confirm password/i).fill('12345');
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Должна быть ошибка валидации
    await expect(page.getByText(/at least 8|minimum 8|8 characters/i)).toBeVisible();
  });

  test('валидация - пароли должны совпадать', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel(/email/i).fill('test-match@example.com');
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByLabel(/confirm password/i).fill('DifferentPass456!');
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page.getByText(/passwords don't match|passwords do not match|match/i)).toBeVisible();
  });
});

test.describe('User Login', () => {
  
  test('успешный логин существующего пользователя', async ({ page }) => {
    // Сначала регистрируем пользователя через API
    const uniqueEmail = `login-test-${Date.now()}@example.com`;
    const password = 'SecurePass123!';
    
    await page.request.post('/api/trpc/auth.register', {
      data: {
        email: uniqueEmail,
        password,
        confirmPassword: password,
      },
    });
    
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await expect(page).toHaveURL(/\/$/, { timeout: 5000 });
    await expect(page.getByText(/logout|sign out/i)).toBeVisible();
  });

  test('ошибка при неверном пароле', async ({ page }) => {
    const uniqueEmail = `wrong-pass-${Date.now()}@example.com`;
    
    // Регистрируем пользователя
    await page.request.post('/api/trpc/auth.register', {
      data: {
        email: uniqueEmail,
        password: 'CorrectPass123!',
        confirmPassword: 'CorrectPass123!',
      },
    });
    
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill('WrongPass456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible();
  });

  test('ошибка при несуществующем email', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('nonexistent-xyz123@example.com');
    await page.getByLabel(/password/i).fill('SomePass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await expect(page.getByText(/invalid|not found|wrong/i)).toBeVisible();
  });
});

test.describe('Health Check', () => {
  
  test('health endpoint доступен', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.api).toBeDefined();
  });

  test('health endpoint не содержит технических деталей', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();
    
    const jsonString = JSON.stringify(body).toLowerCase();
    
    expect(jsonString).not.toContain('prisma');
    expect(jsonString).not.toContain('sqlite');
    expect(jsonString).not.toContain('unable to open');
    expect(jsonString).not.toContain('error code');
  });
});
