# Deployment Instructions for Todo App

## Server Setup

### 1. Create directory on server

```bash
ssh user@your-server
mkdir -p ~/todo-app
cd ~/todo-app
```

### 2. Create docker-compose.yml on server

```yaml
version: '3.8'

services:
  api:
    image: ghcr.io/dvornicked/todo-app/api:latest
    container_name: todo-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/todos.db
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    volumes:
      - ./data:/app/data
    networks:
      - todo-network

  web:
    image: ghcr.io/dvornicked/todo-app/web:latest
    container_name: todo-web
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:80"
    depends_on:
      - api
    networks:
      - todo-network

networks:
  todo-network:
    driver: bridge
```

### 3. Create .env file on server

```bash
cat > .env << 'EOF'
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
EOF
```

### 4. Configure Caddy

Add to `/etc/caddy/Caddyfile`:

```
todos.pets.dvornicked.ru {
    reverse_proxy localhost:3000

    handle /api/* {
        uri strip_prefix /api
        reverse_proxy localhost:3001
    }

    handle /trpc {
        reverse_proxy localhost:3001
    }

    handle /trpc/* {
        reverse_proxy localhost:3001
    }
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

### 5. Login to GitHub Container Registry

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u dvornicked --password-stdin
```

### 6. Pull and run

```bash
docker-compose pull
docker-compose up -d
```

## GitHub Secrets Setup

Go to Repository Settings → Secrets and variables → Actions, add:

- `SSH_HOST` - Your server IP/domain
- `SSH_USER` - Server username  
- `SSH_KEY` - Private SSH key for deployment
- `JWT_SECRET` - Random 256-bit string
- `JWT_REFRESH_SECRET` - Different random 256-bit string

## Database Migration

On first run, initialize the database:

```bash
docker-compose exec api npx prisma migrate deploy
```

## Monitoring

Check logs:
```bash
docker-compose logs -f api
docker-compose logs -f web
```

Health check:
```bash
curl https://todos.pets.dvornicked.ru/api/health
```
