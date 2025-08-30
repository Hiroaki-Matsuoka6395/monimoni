.PHONY: help up down logs web api db migrate seed test fmt lint clean

# Default target
help:
	@echo "MoneyMoni Development Commands"
	@echo "=============================="
	@echo "up         - Start all services"
	@echo "down       - Stop all services"
	@echo "logs       - Show all service logs"
	@echo "web        - Show web service logs"
	@echo "api        - Show API service logs"
	@echo "db         - Show database logs"
	@echo "migrate    - Run database migrations"
	@echo "seed       - Run database seeding"
	@echo "test       - Run all tests"
	@echo "test-api   - Run API tests only"
	@echo "test-web   - Run web tests only"
	@echo "fmt        - Format code"
	@echo "lint       - Lint code"
	@echo "clean      - Clean up containers and volumes"
	@echo "shell-api  - Open shell in API container"
	@echo "shell-db   - Open MySQL shell"

# Docker operations
up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

web:
	docker-compose logs -f web

api:
	docker-compose logs -f api

db:
	docker-compose logs -f db

# Database operations
migrate:
	docker-compose exec api alembic upgrade head

seed:
	docker-compose exec api python -m app.scripts.seed_data

# Testing
test: test-api test-web

test-api:
	docker-compose exec api pytest -v

test-web:
	docker-compose exec web npm test

# Code quality
fmt:
	docker-compose exec api ruff format .
	docker-compose exec api ruff check --fix .
	docker-compose exec web npm run format

lint:
	docker-compose exec api ruff check .
	docker-compose exec web npm run lint

# Utilities
clean:
	docker-compose down -v
	docker system prune -f

shell-api:
	docker-compose exec api bash

shell-db:
	docker-compose exec db mysql -u $(MYSQL_USER) -p$(MYSQL_PASSWORD) $(MYSQL_DATABASE)

# Backup operations
backup:
	docker-compose exec backup /backup.sh

restore:
	@echo "To restore from backup, run:"
	@echo "docker-compose exec db mysql -u root -p$(MYSQL_ROOT_PASSWORD) $(MYSQL_DATABASE) < /path/to/backup.sql"

# Development setup
setup:
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file. Please review and update values."; fi
	docker-compose up -d db
	@echo "Waiting for database to be ready..."
	@sleep 10
	make migrate
	make seed
	docker-compose up -d

# Production build
build:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost/api/healthz || echo "API health check failed"
	@curl -f http://localhost || echo "Frontend health check failed"
