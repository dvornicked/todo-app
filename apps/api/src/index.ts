import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import dotenv from 'dotenv';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';

dotenv.config();

const server = fastify({
  logger: process.env.NODE_ENV === 'development',
});

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
  // Register plugins
  await server.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  await server.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
    parseOptions: {},
  });

  // Register tRPC
  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  });

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Error handler
  server.setErrorHandler((error: Error, request, reply) => {
    server.log.error(error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  });

  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 tRPC endpoint: http://localhost:${PORT}/trpc`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
