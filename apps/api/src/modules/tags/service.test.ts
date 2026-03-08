import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tagService from './service';
import { prisma } from '../../prisma';

vi.mock('../../prisma', () => ({
  prisma: {
    tag: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Tag Service', () => {
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTags', () => {
    it('должен возвращать список тегов пользователя', async () => {
      const mockTags = [
        { id: '1', name: 'Work', color: '#3B82F6', userId },
        { id: '2', name: 'Personal', color: '#10B981', userId },
      ];
      (prisma.tag.findMany as any).mockResolvedValue(mockTags);

      const result = await tagService.getTags(userId);

      expect(result).toEqual(mockTags);
      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { name: 'asc' },
      });
    });

    it('должен возвращать пустой массив если тегов нет', async () => {
      (prisma.tag.findMany as any).mockResolvedValue([]);

      const result = await tagService.getTags(userId);

      expect(result).toEqual([]);
    });
  });

  describe('createTag', () => {
    it('должен создавать тег с цветом по умолчанию', async () => {
      const mockTag = { id: '1', name: 'Work', color: '#3B82F6', userId };
      (prisma.tag.create as any).mockResolvedValue(mockTag);

      const result = await tagService.createTag(userId, { name: 'Work' });

      expect(result).toEqual(mockTag);
      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: {
          name: 'Work',
          color: '#3B82F6',
          userId,
        },
      });
    });

    it('должен создавать тег с кастомным цветом', async () => {
      const mockTag = { id: '1', name: 'Urgent', color: '#FF0000', userId };
      (prisma.tag.create as any).mockResolvedValue(mockTag);

      const result = await tagService.createTag(userId, {
        name: 'Urgent',
        color: '#FF0000',
      });

      expect(result.color).toBe('#FF0000');
    });

    it('должен выбрасывать ошибку при дубликате имени', async () => {
      (prisma.tag.create as any).mockRejectedValue(new Error('Unique constraint'));

      await expect(
        tagService.createTag(userId, { name: 'Work' })
      ).rejects.toThrow('Tag with this name already exists');
    });
  });

  describe('updateTag', () => {
    it('должен обновлять тег', async () => {
      const existingTag = { id: '1', name: 'Work', color: '#3B82F6', userId };
      const updatedTag = { id: '1', name: 'Work Updated', color: '#FF0000', userId };

      (prisma.tag.findFirst as any).mockResolvedValue(existingTag);
      (prisma.tag.update as any).mockResolvedValue(updatedTag);

      const result = await tagService.updateTag(userId, '1', {
        name: 'Work Updated',
        color: '#FF0000',
      });

      expect(result).toEqual(updatedTag);
    });

    it('должен выбрасывать ошибку если тег не найден', async () => {
      (prisma.tag.findFirst as any).mockResolvedValue(null);

      await expect(
        tagService.updateTag(userId, 'nonexistent', { name: 'Updated' })
      ).rejects.toThrow('Tag not found');
    });

    it('должен обновлять только имя', async () => {
      const existingTag = { id: '1', name: 'Work', color: '#3B82F6', userId };
      (prisma.tag.findFirst as any).mockResolvedValue(existingTag);
      (prisma.tag.update as any).mockResolvedValue({ ...existingTag, name: 'New Name' });

      await tagService.updateTag(userId, '1', { name: 'New Name' });

      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'New Name' },
      });
    });
  });

  describe('deleteTag', () => {
    it('должен удалять тег', async () => {
      const mockTag = { id: '1', name: 'Work', userId };
      (prisma.tag.findFirst as any).mockResolvedValue(mockTag);

      const result = await tagService.deleteTag(userId, '1');

      expect(result).toEqual({ success: true });
      expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('должен выбрасывать ошибку если тег не найден', async () => {
      (prisma.tag.findFirst as any).mockResolvedValue(null);

      await expect(tagService.deleteTag(userId, 'nonexistent')).rejects.toThrow('Tag not found');
    });
  });
});
