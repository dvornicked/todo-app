import { z } from 'zod';

// Enums
export const todoStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED']);
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// User schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Todo schemas
export const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: todoStatusSchema.default('TODO'),
  priority: prioritySchema.default('MEDIUM'),
  dueDate: z.date().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  subtasks: z.array(z.object({
    title: z.string().min(1).max(200),
  })).default([]),
});

export const updateTodoSchema = createTodoSchema.partial().extend({
  id: z.string(),
});

export const todoFiltersSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(25),
  status: todoStatusSchema.optional(),
  priority: prioritySchema.optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
});

// Types
export type TodoStatus = z.infer<typeof todoStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type TodoFilters = z.infer<typeof todoFiltersSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
