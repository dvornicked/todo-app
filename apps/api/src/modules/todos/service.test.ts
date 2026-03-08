import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as todoService from './service';
import { prisma } from '../../prisma';
import { withDbErrorHandling } from '../../lib/db-errors';

vi.mock('../../prisma', () => ({
  prisma: {
    todo: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    subtask: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../../lib/db-errors', () => ({
  withDbErrorHandling: vi.fn((fn) => fn()),
}));

describe('Todo Service', () => {
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodos', () => {
    it('должен возвращать список todos с пагинацией', async () => {
      const mockTodos = [
        { id: '1', title: 'Todo 1', userId },
        { id: '2', title: 'Todo 2', userId },
      ];

      (prisma.todo.findMany as any).mockResolvedValue(mockTodos);
      (prisma.todo.count as any).mockResolvedValue(10);

      const result = await todoService.getTodos(userId, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.todos).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 10,
        totalPages: 1,
      });
    });

    it('должен фильтровать по статусу', async () => {
      (prisma.todo.findMany as any).mockResolvedValue([]);
      (prisma.todo.count as any).mockResolvedValue(0);

      await todoService.getTodos(userId, {
        page: 1,
        limit: 10,
        status: 'DONE',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            status: 'DONE',
          }),
        })
      );
    });

    it('должен фильтровать по приоритету', async () => {
      (prisma.todo.findMany as any).mockResolvedValue([]);
      (prisma.todo.count as any).mockResolvedValue(0);

      await todoService.getTodos(userId, {
        page: 1,
        limit: 10,
        priority: 'HIGH',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            priority: 'HIGH',
          }),
        })
      );
    });

    it('должен искать по title и description', async () => {
      (prisma.todo.findMany as any).mockResolvedValue([]);
      (prisma.todo.count as any).mockResolvedValue(0);

      await todoService.getTodos(userId, {
        page: 1,
        limit: 10,
        search: 'important',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            OR: [
              { title: { contains: 'important' } },
              { description: { contains: 'important' } },
            ],
          }),
        })
      );
    });

    it('должен фильтровать по тегам', async () => {
      (prisma.todo.findMany as any).mockResolvedValue([]);
      (prisma.todo.count as any).mockResolvedValue(0);

      await todoService.getTodos(userId, {
        page: 1,
        limit: 10,
        tags: ['tag-1', 'tag-2'],
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            tags: { some: { id: { in: ['tag-1', 'tag-2'] } } },
          }),
        })
      );
    });

    it('должен правильно считать totalPages', async () => {
      (prisma.todo.findMany as any).mockResolvedValue([]);
      (prisma.todo.count as any).mockResolvedValue(25);

      const result = await todoService.getTodos(userId, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.pagination.totalPages).toBe(3); // 25 / 10 = 2.5 → 3
    });

    it('должен правильно рассчитывать skip для страниц', async () => {
      (prisma.todo.findMany as any).mockResolvedValue([]);
      (prisma.todo.count as any).mockResolvedValue(100);

      await todoService.getTodos(userId, {
        page: 3,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3 - 1) * 20 = 40
          take: 20,
        })
      );
    });
  });

  describe('getTodoById', () => {
    it('должен возвращать todo по id', async () => {
      const mockTodo = { id: '1', title: 'Test', userId };
      (prisma.todo.findFirst as any).mockResolvedValue(mockTodo);

      const result = await todoService.getTodoById(userId, '1');

      expect(result).toEqual(mockTodo);
      expect(prisma.todo.findFirst).toHaveBeenCalledWith({
        where: { id: '1', userId },
        include: {
          tags: true,
          subtasks: { orderBy: { order: 'asc' } },
        },
      });
    });

    it('должен возвращать null если todo не найден', async () => {
      (prisma.todo.findFirst as any).mockResolvedValue(null);

      const result = await todoService.getTodoById(userId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createTodo', () => {
    it('должен создавать todo с базовыми полями', async () => {
      const mockTodo = { id: '1', title: 'New Todo', userId };
      (prisma.todo.create as any).mockResolvedValue(mockTodo);

      const result = await todoService.createTodo(userId, {
        title: 'New Todo',
        description: 'Description',
        status: 'TODO',
        priority: 'MEDIUM',
        tagIds: [],
        subtasks: [],
      });

      expect(result).toEqual(mockTodo);
      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: {
          title: 'New Todo',
          description: 'Description',
          status: 'TODO',
          priority: 'MEDIUM',
          userId,
        },
        include: {
          tags: true,
          subtasks: { orderBy: { order: 'asc' } },
        },
      });
    });

    it('должен создавать todo с тегами', async () => {
      const mockTodo = { id: '1', title: 'New Todo', userId, tags: [{ id: 'tag-1' }] };
      (prisma.todo.create as any).mockResolvedValue(mockTodo);

      await todoService.createTodo(userId, {
        title: 'New Todo',
        status: 'TODO',
        priority: 'MEDIUM',
        tagIds: ['tag-1', 'tag-2'],
        subtasks: [],
      });

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: { connect: [{ id: 'tag-1' }, { id: 'tag-2' }] },
        }),
        include: expect.any(Object),
      });
    });

    it('должен создавать todo с подзадачами', async () => {
      const mockTodo = { id: '1', title: 'New Todo', userId };
      (prisma.todo.create as any).mockResolvedValue(mockTodo);

      await todoService.createTodo(userId, {
        title: 'New Todo',
        status: 'TODO',
        priority: 'MEDIUM',
        tagIds: [],
        subtasks: [
          { title: 'Subtask 1' },
          { title: 'Subtask 2' },
        ],
      });

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subtasks: {
            create: [
              { title: 'Subtask 1', order: 0 },
              { title: 'Subtask 2', order: 1 },
            ],
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('updateTodo', () => {
    it('должен обновлять todo', async () => {
      const existingTodo = { id: '1', title: 'Old', userId, subtasks: [] };
      const updatedTodo = { id: '1', title: 'Updated', userId };

      (prisma.todo.findFirst as any).mockResolvedValue(existingTodo);
      (prisma.todo.update as any).mockResolvedValue(updatedTodo);

      const result = await todoService.updateTodo(userId, {
        id: '1',
        title: 'Updated',
        status: 'DONE',
      });

      expect(result).toEqual(updatedTodo);
    });

    it('должен выбрасывать ошибку если todo не найден', async () => {
      (prisma.todo.findFirst as any).mockResolvedValue(null);

      await expect(
        todoService.updateTodo(userId, { id: 'nonexistent', title: 'Updated' })
      ).rejects.toThrow('Todo not found');
    });

    it('должен заменять подзадачи при обновлении', async () => {
      const existingTodo = { id: '1', title: 'Old', userId, subtasks: [{ id: 'sub-1' }] };
      (prisma.todo.findFirst as any).mockResolvedValue(existingTodo);
      (prisma.todo.update as any).mockResolvedValue({ id: '1', title: 'Updated', userId });

      await todoService.updateTodo(userId, {
        id: '1',
        title: 'Updated',
        subtasks: [{ title: 'New Subtask' }],
      });

      expect(prisma.subtask.deleteMany).toHaveBeenCalledWith({ where: { todoId: '1' } });
      expect(prisma.todo.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          subtasks: {
            create: [{ title: 'New Subtask', order: 0 }],
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('deleteTodo', () => {
    it('должен удалять todo', async () => {
      const mockTodo = { id: '1', title: 'To Delete', userId };
      (prisma.todo.findFirst as any).mockResolvedValue(mockTodo);
      (prisma.todo.delete as any).mockResolvedValue(mockTodo);

      const result = await todoService.deleteTodo(userId, '1');

      expect(result).toEqual({ success: true });
      expect(prisma.todo.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('должен выбрасывать ошибку если todo не найден', async () => {
      (prisma.todo.findFirst as any).mockResolvedValue(null);

      await expect(todoService.deleteTodo(userId, 'nonexistent')).rejects.toThrow('Todo not found');
    });
  });

  describe('getTodoCount', () => {
    it('должен возвращать количество todos', async () => {
      (prisma.todo.count as any).mockResolvedValue(42);

      const result = await todoService.getTodoCount(userId);

      expect(result).toBe(42);
      expect(prisma.todo.count).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
