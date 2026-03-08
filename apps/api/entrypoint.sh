#!/bin/sh
set -e

echo "🔄 Checking database..."

# Если БД уже существует (есть таблицы), пропускаем миграции
if [ -f /app/data/todos.db ]; then
  echo "✓ Database already exists, skipping migrations"
else
  echo "🔄 Initializing database..."
  npx prisma db push --accept-data-loss || true
fi

echo "🚀 Starting API server..."
exec node dist/index.js
