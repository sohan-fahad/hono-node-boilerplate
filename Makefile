.PHONY: help install dev build start clean
.PHONY: docker-up docker-down docker-logs docker-restart docker-clean docker-rebuild docker-ps docker-shell
.PHONY: docker-dev-up docker-dev-down docker-dev-rebuild docker-dev-logs docker-dev-clean
.PHONY: db-gen db-push db-migrate db-studio db-reset
.PHONY: test-db check

# ==================== Help ====================
help: ## Show this help message
	@echo ''
	@echo '📚 Available commands:'
	@echo ''
	@awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ''

# ==================== Local Development ====================
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	pnpm install

dev: ## Start development server (local)
	@echo "🚀 Starting development server..."
	pnpm dev

build: ## Build for production
	@echo "🔨 Building application..."
	pnpm build

start: ## Start production server
	@echo "▶️  Starting production server..."
	pnpm start

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist node_modules

# ==================== Docker - Production ====================
docker-up: ## Start production services (postgres, redis, app)
	@echo "🐳 Starting production services..."
	docker-compose up -d
	@echo "✅ Services started! App: http://localhost:3000"
	@echo "📄 API Docs: http://localhost:3000/ui"

docker-down: ## Stop production services
	@echo "🛑 Stopping production services..."
	docker-compose down

docker-build: ## Build production Docker images
	@echo "🔨 Building production images..."
	docker-compose build

docker-rebuild: ## Rebuild and restart production services
	@echo "♻️  Rebuilding production services..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✅ Services rebuilt and started!"

docker-logs: ## View application logs (production)
	docker-compose logs -f app

docker-restart: ## Restart production app container
	docker-compose restart app

docker-clean: ## Stop and remove all production containers and volumes
	@echo "🗑️  Removing production containers and volumes..."
	docker-compose down -v
	@echo "✅ Production environment cleaned!"

docker-ps: ## Show running containers
	docker-compose ps

docker-shell: ## Open shell in production app container
	docker-compose exec app sh

# ==================== Docker - Development ====================
docker-dev-up: ## Start development services with hot reload
	@echo "🐳 Starting development services..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Dev services started with hot reload!"
	@echo "📱 App: http://localhost:3000"
	@echo "📄 API Docs: http://localhost:3000/ui"

docker-dev-down: ## Stop development services
	@echo "🛑 Stopping development services..."
	docker-compose -f docker-compose.dev.yml down

docker-dev-rebuild: ## Rebuild and restart development services
	@echo "♻️  Rebuilding development services..."
	docker-compose -f docker-compose.dev.yml down
	docker volume rm hono-starter_node_modules_dev 2>/dev/null || true
	docker-compose -f docker-compose.dev.yml build --no-cache
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Dev services rebuilt and started!"

docker-dev-logs: ## View development app logs
	docker-compose -f docker-compose.dev.yml logs -f app

docker-dev-clean: ## Stop and remove all dev containers and volumes
	@echo "🗑️  Removing dev containers and volumes..."
	docker-compose -f docker-compose.dev.yml down -v
	docker volume rm hono-starter_node_modules_dev 2>/dev/null || true
	@echo "✅ Development environment cleaned!"

# ==================== Database ====================
db-gen: ## Generate database migrations from schema
	@echo "🔄 Generating migrations..."
	pnpm db:gen

db-push: ## Push schema changes to database (development)
	@echo "📤 Pushing schema to database..."
	pnpm db:push

db-migrate: ## Run pending migrations (production)
	@echo "⬆️  Running migrations..."
	pnpm db:migrate

db-studio: ## Open Drizzle Studio (visual database browser)
	@echo "🎨 Opening Drizzle Studio..."
	pnpm db:studio

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "⚠️  Resetting database..."
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.dev.yml up -d postgres redis
	@echo "⏳ Waiting for database to be ready..."
	@sleep 5
	@echo "📤 Pushing schema..."
	pnpm db:push
	@echo "✅ Database reset complete!"

# ==================== Testing & Health Checks ====================
test-db: ## Test database connection
	@echo "🔍 Testing database connection..."
	@docker exec -it hono-postgres-dev psql -U admin -d hono_db -c "SELECT version();" 2>/dev/null && echo "✅ Database connection successful!" || echo "❌ Database connection failed!"

check: ## Check if all services are running
	@echo "🔍 Checking services..."
	@echo ""
	@echo "PostgreSQL:"
	@docker ps | grep postgres || echo "  ❌ Not running"
	@echo ""
	@echo "Redis:"
	@docker ps | grep redis || echo "  ❌ Not running"
	@echo ""
	@echo "Application:"
	@docker ps | grep hono-app || echo "  ❌ Not running"

# ==================== Quick Setup ====================
setup: install docker-dev-up ## Complete setup: install deps and start dev services
	@echo ""
	@echo "⏳ Waiting for database to be ready..."
	@sleep 8
	@echo "📤 Pushing database schema..."
	@$(MAKE) db-push
	@echo ""
	@echo "✨ Setup complete!"
	@echo ""
	@echo "🎉 Your application is ready!"
	@echo "📱 App:      http://localhost:3000"
	@echo "📄 Docs:     http://localhost:3000/ui"
	@echo "🗄️  Studio:   make db-studio"
	@echo ""
	@echo "💡 Run 'make dev' to start the app locally"
	@echo "💡 Run 'make help' to see all available commands"