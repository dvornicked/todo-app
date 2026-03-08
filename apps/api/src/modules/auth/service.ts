import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma';
import { withDbErrorHandling } from '../../lib/db-errors';
import type { LoginInput, RegisterInput } from '@todo/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ userId, email, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existingUser = await withDbErrorHandling(
    () => prisma.user.findUnique({ where: { email: input.email } }),
    'register.findUser'
  );

  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await withDbErrorHandling(
    () => prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
      },
      select: { id: true, email: true, createdAt: true },
    }),
    'register.createUser'
  );

  return user;
}

export async function login(input: LoginInput) {
  const user = await withDbErrorHandling(
    () => prisma.user.findUnique({ where: { email: input.email } }),
    'login.findUser'
  );

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await verifyPassword(input.password, user.password);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const tokens = generateTokens(user.id, user.email);

  // Store refresh token
  const hashedRefresh = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
  await withDbErrorHandling(
    () => prisma.refreshToken.create({
      data: {
        token: hashedRefresh,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    'login.createRefreshToken'
  );

  return {
    user: { id: user.id, email: user.email },
    ...tokens,
  };
}

export async function refreshTokens(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await withDbErrorHandling(
      () => prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { refreshTokens: true },
      }),
      'refreshTokens.findUser'
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Verify refresh token exists
    const tokenValid = await Promise.all(
      user.refreshTokens.map((t) => bcrypt.compare(refreshToken, t.token))
    );

    if (!tokenValid.some(Boolean)) {
      throw new Error('Invalid refresh token');
    }

    const tokens = generateTokens(user.id, user.email);

    // Replace old refresh token
    const hashedNew = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
    const oldTokenIndex = tokenValid.findIndex(Boolean);
    await withDbErrorHandling(
      () => prisma.refreshToken.update({
        where: { id: user.refreshTokens[oldTokenIndex].id },
        data: {
          token: hashedNew,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
      'refreshTokens.updateToken'
    );

    return tokens;
  } catch {
    throw new Error('Invalid refresh token');
  }
}

export async function logout(userId: string, refreshToken: string) {
  const user = await withDbErrorHandling(
    () => prisma.user.findUnique({
      where: { id: userId },
      include: { refreshTokens: true },
    }),
    'logout.findUser'
  );

  if (!user) return;

  // Find and delete the specific refresh token
  for (const token of user.refreshTokens) {
    const isMatch = await bcrypt.compare(refreshToken, token.token);
    if (isMatch) {
      await withDbErrorHandling(
        () => prisma.refreshToken.delete({ where: { id: token.id } }),
        'logout.deleteToken'
      );
      break;
    }
  }
}
