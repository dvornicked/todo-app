import { test, expect } from '@playwright/test';

/**
 * Полные E2E тесты Todo App
 * Покрывают: регистрацию, логин, создание/редактирование/удаление todos, теги, поиск, пагинацию
 */

test.describe('Полный пользовательский сценарий', () => {
  const uniqueEmail = `e2e-${Date.now()}@test.com`;
  const password = 'SecurePass123!';

  test('полный flow: регистрация → создание todo → поиск → удаление', async ({ page }) => {
    // 1. Регистрация
    await page.goto('/register');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByRole('button', { name: /create account/i }).click();

    // Ждём редирект на главную
    await expect(page).toHaveURL(/\/$/, { timeout: 5000 });

    // 2. Создание todo
    await page.getByPlaceholder(/add.*todo|new.*task|what needs/i).fill('My first todo');
    await page.getByRole('button', { name: /add|create/i }).click();

    // Проверяем что todo появилось
    await expect(page.getByText('My first todo')).toBeVisible();

    // 3. Создание todo с приоритетом
    await page.getByPlaceholder(/add.*todo/i).fill('High priority task');
    await page.getByRole('combobox').selectOption('HIGH');
    await page.getByRole('button', { name: /add/i }).click();

    await expect(page.getByText('High priority task')).toBeVisible();

    // 4. Поиск todo
    await page.getByPlaceholder(/search/i).fill('first');
    await page.keyboard.press('Enter');

    // Должно показываться только "My first todo"
    await expect(page.getByText('My first todo')).toBeVisible();
    await expect(page.getByText('High priority task')).not.toBeVisible();

    // Сброс поиска
    await page.getByPlaceholder(/search/i).clear();
    await page.keyboard.press('Enter');

    // 5. Отметить todo как выполненное
    await page.locator('[data-testid="todo-checkbox"]').first().click();
    await expect(page.locator('[data-testid="todo-completed"]')).toBeVisible();

    // 6. Удаление todo
    await page.locator('[data-testid="todo-delete"]').first().click();
    await expect(page.getByText('My first todo')).not.toBeVisible();
  });
});

test.describe('Todos - CRUD операции', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Создаём тестового пользователя
    const email = `todo-test-${Date.now()}@test.com`;
    const password = 'SecurePass123!';

    await request.post('/api/trpc/auth.register', {
      data: { email, password, confirmPassword: password },
    });

    const loginResponse = await request.post('/api/trpc/auth.login', {
      data: { email, password },
    });

    const loginData = await loginResponse.json();
    authToken = loginData.result.data.accessToken;
  });

  test('создание todo через API', async ({ request }) => {
    const response = await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        title: 'API Test Todo',
        description: 'Created via API',
        status: 'TODO',
        priority: 'MEDIUM',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.result.data.title).toBe('API Test Todo');
  });

  test('получение списка todos с пагинацией', async ({ request }) => {
    // Создаём несколько todos
    for (let i = 0; i < 5; i++) {
      await request.post('/api/trpc/todos.create', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          title: `Todo ${i}`,
          status: 'TODO',
          priority: 'MEDIUM',
        },
      });
    }

    // Запрашиваем первую страницу
    const response = await request.post('/api/trpc/todos.list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { page: 1, limit: 3 },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.result.data.todos).toHaveLength(3);
    expect(data.result.data.pagination.page).toBe(1);
    expect(data.result.data.pagination.limit).toBe(3);
    expect(data.result.data.pagination.totalPages).toBeGreaterThanOrEqual(2);
  });

  test('фильтрация по статусу', async ({ request }) => {
    // Создаём todo со статусом DONE
    await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'Done Todo', status: 'DONE', priority: 'MEDIUM' },
    });

    const response = await request.post('/api/trpc/todos.list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { page: 1, limit: 10, status: 'DONE' },
    });

    const data = await response.json();
    expect(data.result.data.todos.every((t: any) => t.status === 'DONE')).toBeTruthy();
  });

  test('поиск по названию', async ({ request }) => {
    await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'UniqueSearchTerm123', status: 'TODO', priority: 'MEDIUM' },
    });

    const response = await request.post('/api/trpc/todos.list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { page: 1, limit: 10, search: 'UniqueSearchTerm123' },
    });

    const data = await response.json();
    expect(data.result.data.todos.some((t: any) => t.title.includes('UniqueSearchTerm123'))).toBeTruthy();
  });

  test('обновление todo', async ({ request }) => {
    // Создаём todo
    const createResponse = await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'To Update', status: 'TODO', priority: 'MEDIUM' },
    });

    const createData = await createResponse.json();
    const todoId = createData.result.data.id;

    // Обновляем
    const updateResponse = await request.post('/api/trpc/todos.update', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { id: todoId, title: 'Updated Title', status: 'IN_PROGRESS' },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();
    expect(updateData.result.data.title).toBe('Updated Title');
    expect(updateData.result.data.status).toBe('IN_PROGRESS');
  });

  test('удаление todo', async ({ request }) => {
    const createResponse = await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'To Delete', status: 'TODO', priority: 'MEDIUM' },
    });

    const todoId = (await createResponse.json()).result.data.id;

    const deleteResponse = await request.post('/api/trpc/todos.delete', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { id: todoId },
    });

    expect(deleteResponse.ok()).toBeTruthy();

    // Проверяем что todo удалено
    const getResponse = await request.post('/api/trpc/todos.getById', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { id: todoId },
    });

    expect(getResponse.status()).toBe(404);
  });
});

test.describe('Tags - управление тегами', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const email = `tag-test-${Date.now()}@test.com`;
    const password = 'SecurePass123!';

    await request.post('/api/trpc/auth.register', {
      data: { email, password, confirmPassword: password },
    });

    const loginResponse = await request.post('/api/trpc/auth.login', {
      data: { email, password },
    });

    authToken = (await loginResponse.json()).result.data.accessToken;
  });

  test('создание тега', async ({ request }) => {
    const response = await request.post('/api/trpc/tags.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: 'Work', color: '#3B82F6' },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.result.data.name).toBe('Work');
    expect(data.result.data.color).toBe('#3B82F6');
  });

  test('получение списка тегов', async ({ request }) => {
    await request.post('/api/trpc/tags.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: 'Personal', color: '#10B981' },
    });

    const response = await request.post('/api/trpc/tags.list', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.result.data).toBeInstanceOf(Array);
    expect(data.result.data.length).toBeGreaterThanOrEqual(1);
  });

  test('создание todo с тегом', async ({ request }) => {
    // Создаём тег
    const tagResponse = await request.post('/api/trpc/tags.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: 'Urgent', color: '#FF0000' },
    });

    const tagId = (await tagResponse.json()).result.data.id;

    // Создаём todo с тегом
    const todoResponse = await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        title: 'Tagged Todo',
        status: 'TODO',
        priority: 'HIGH',
        tagIds: [tagId],
      },
    });

    const todoData = await todoResponse.json();
    expect(todoData.result.data.tags).toHaveLength(1);
    expect(todoData.result.data.tags[0].name).toBe('Urgent');
  });

  test('фильтрация todo по тегу', async ({ request }) => {
    // Создаём тег
    const tagResponse = await request.post('/api/trpc/tags.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: 'Filtered', color: '#0000FF' },
    });

    const tagId = (await tagResponse.json()).result.data.id;

    // Создаём todo с этим тегом и без
    await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'With Tag', status: 'TODO', priority: 'MEDIUM', tagIds: [tagId] },
    });

    await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'Without Tag', status: 'TODO', priority: 'MEDIUM' },
    });

    // Фильтруем по тегу
    const response = await request.post('/api/trpc/todos.list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { page: 1, limit: 10, tags: [tagId] },
    });

    const data = await response.json();
    expect(data.result.data.todos.every((t: any) => 
      t.tags.some((tag: any) => tag.id === tagId)
    )).toBeTruthy();
  });
});

test.describe('Пагинация', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const email = `pagination-test-${Date.now()}@test.com`;
    const password = 'SecurePass123!';

    await request.post('/api/trpc/auth.register', {
      data: { email, password, confirmPassword: password },
    });

    const loginResponse = await request.post('/api/trpc/auth.login', {
      data: { email, password },
    });

    authToken = (await loginResponse.json()).result.data.accessToken;

    // Создаём 25 todos для тестов пагинации
    for (let i = 1; i <= 25; i++) {
      await request.post('/api/trpc/todos.create', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { title: `Todo ${i}`, status: 'TODO', priority: 'MEDIUM' },
      });
    }
  });

  test('первая страница содержит limit элементов', async ({ request }) => {
    const response = await request.post('/api/trpc/todos.list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { page: 1, limit: 10 },
    });

    const data = await response.json();
    expect(data.result.data.todos).toHaveLength(10);
    expect(data.result.data.pagination.total).toBeGreaterThanOrEqual(25);
    expect(data.result.data.pagination.totalPages).toBeGreaterThanOrEqual(3);
  });

  test('вторая страница содержит следующие элементы', async ({ request }) => {
    const response1 = await request.post('/api/trpc/todos.list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { page: 1, limit: 10 },
    });

    const response2 = await request.post('/api/trpc/todos.list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { page: 2, limit: 10 },
    });

    const page1 = await response1.json();
    const page2 = await response2.json();

    // ID на второй странице должны отличаться от первой
    const page1Ids = page1.result.data.todos.map((t: any) => t.id);
    const page2Ids = page2.result.data.todos.map((t: any) => t.id);

    expect(page2Ids.some((id: string) => page1Ids.includes(id))).toBeFalsy();
  });

  test('последняя страница может содержать меньше элементов', async ({ request }) => {
    const response = await request.post('/api/trpc/todos.list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { page: 3, limit: 10 },
    });

    const data = await response.json();
    expect(data.result.data.todos.length).toBeGreaterThan(0);
    expect(data.result.data.todos.length).toBeLessThanOrEqual(10);
  });
});

test.describe('Сортировка', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const email = `sort-test-${Date.now()}@test.com`;
    const password = 'SecurePass123!';

    await request.post('/api/trpc/auth.register', {
      data: { email, password, confirmPassword: password },
    });

    const loginResponse = await request.post('/api/trpc/auth.login', {
      data: { email, password },
    });

    authToken = (await loginResponse.json()).result.data.accessToken;
  });

  test('сортировка по приоритету', async ({ request }) => {
    // Создаём todos с разными приоритетами
    await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'Low Priority', status: 'TODO', priority: 'LOW' },
    });

    await request.post('/api/trpc/todos.create', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'High Priority', status: 'TODO', priority: 'HIGH' },
    });

    const response = await request.post('/api/trpc/todos.list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { page: 1, limit: 10, sortBy: 'priority', sortOrder: 'desc' },
    });

    const data = await response.json();
    const priorities = data.result.data.todos.map((t: any) => t.priority);
    
    // HIGH должен быть перед LOW при desc сортировке
    const highIndex = priorities.indexOf('HIGH');
    const lowIndex = priorities.indexOf('LOW');
    expect(highIndex).toBeLessThan(lowIndex);
  });
});

test.describe('Обработка ошибок', () => {
  test('доступ без авторизации возвращает 401', async ({ request }) => {
    const response = await request.post('/api/trpc/todos.list', {
      data: { page: 1, limit: 10 },
    });

    expect(response.status()).toBe(401);
  });

  test('получение несуществующего todo возвращает 404', async ({ request }) => {
    const email = `error-test-${Date.now()}@test.com`;
    const password = 'SecurePass123!';

    await request.post('/api/trpc/auth.register', {
      data: { email, password, confirmPassword: password },
    });

    const loginResponse = await request.post('/api/trpc/auth.login', {
      data: { email, password },
    });

    const token = (await loginResponse.json()).result.data.accessToken;

    const response = await request.post('/api/trpc/todos.getById', {
      headers: { Authorization: `Bearer ${token}` },
      data: { id: 'nonexistent-id' },
    });

    expect(response.status()).toBe(404);
  });
});
