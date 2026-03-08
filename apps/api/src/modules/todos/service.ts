import { prisma } from '../../prisma';
import type { CreateTodoInput, UpdateTodoInput, TodoFilters } from '@todo/shared';

export async function getTodos(userId: string, filters: TodoFilters) {
  const { page, limit, status, priority, tags, search, sortBy, sortOrder } = filters;

  const where = {
    userId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(tags?.length && { tags: { some: { id: { in: tags } } } }),
    ...(search && {
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ],
    }),
  };

  const [todos, total] = await Promise.all([
    prisma.todo.findMany({
      where,
      include: {
        tags: true,
        subtasks: { orderBy: { order: 'asc' } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.todo.count({ where }),
  ]);

  return {
    todos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTodoById(userId: string, id: string) {
  return prisma.todo.findFirst({
    where: { id, userId },
    include: {
      tags: true,
      subtasks: { orderBy: { order: 'asc' } },
    },
  });
}

export async function createTodo(userId: string, input: CreateTodoInput) {
  const { tagIds, subtasks, ...todoData } = input;

  return prisma.todo.create({
    data: {
      ...todoData,
      userId,
      tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      subtasks: subtasks?.length
        ? {
            create: subtasks.map((s, i) => ({
              title: s.title,
              order: i,
            })),
          }
        : undefined,
    },
    include: {
      tags: true,
      subtasks: { orderBy: { order: 'asc' } },
    },
  });
}

export async function updateTodo(userId: string, input: UpdateTodoInput) {
  const { id, tagIds, subtasks, ...todoData } = input;

  const existing = await prisma.todo.findFirst({
    where: { id, userId },
    include: { subtasks: true },
  });

  if (!existing) {
    throw new Error('Todo not found');
  }

  // If subtasks provided, replace them
  if (subtasks !== undefined) {
    await prisma.subtask.deleteMany({ where: { todoId: id } });
  }

  return prisma.todo.update({
    where: { id },
    data: {
      ...todoData,
      tags: tagIds ? { set: tagIds.map((id) => ({ id })) } : undefined,
      subtasks: subtasks?.length
        ? {
            create: subtasks.map((s, i) => ({
              title: s.title,
              order: i,
            })),
          }
        : undefined,
    },
    include: {
      tags: true,
      subtasks: { orderBy: { order: 'asc' } },
    },
  });
}

export async function deleteTodo(userId: string, id: string) {
  const todo = await prisma.todo.findFirst({
    where: { id, userId },
  });

  if (!todo) {
    throw new Error('Todo not found');
  }

  await prisma.todo.delete({ where: { id } });
  return { success: true };
}

export async function getTodoCount(userId: string) {
  return prisma.todo.count({ where: { userId } });
}
