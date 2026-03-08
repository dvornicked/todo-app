import { prisma } from '../../prisma';
import { withDbErrorHandling } from '../../lib/db-errors';

export async function getTags(userId: string) {
  return withDbErrorHandling(
    () => prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),
    'getTags'
  );
}

export async function createTag(
  userId: string,
  input: { name: string; color?: string }
) {
  try {
    return await withDbErrorHandling(
      () => prisma.tag.create({
        data: {
          name: input.name,
          color: input.color || '#3B82F6',
          userId,
        },
      }),
      'createTag'
    );
  } catch (error) {
    throw new Error('Tag with this name already exists');
  }
}

export async function updateTag(
  userId: string,
  tagId: string,
  input: { name?: string; color?: string }
) {
  const tag = await withDbErrorHandling(
    () => prisma.tag.findFirst({
      where: { id: tagId, userId },
    }),
    'updateTag.find'
  );

  if (!tag) {
    throw new Error('Tag not found');
  }

  return withDbErrorHandling(
    () => prisma.tag.update({
      where: { id: tagId },
      data: {
        name: input.name,
        color: input.color,
      },
    }),
    'updateTag.update'
  );
}

export async function deleteTag(userId: string, tagId: string) {
  const tag = await withDbErrorHandling(
    () => prisma.tag.findFirst({
      where: { id: tagId, userId },
    }),
    'deleteTag.find'
  );

  if (!tag) {
    throw new Error('Tag not found');
  }

  await withDbErrorHandling(
    () => prisma.tag.delete({ where: { id: tagId } }),
    'deleteTag.delete'
  );

  return { success: true };
}
