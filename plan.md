# monimoni - Two-Person Household Budgeting App

## Project Overview
Full-stack budgeting app for couples with 50/50 split capabilities, receipt management, and CSV import/export.

**Stack**: React (TypeScript, Vite) + MUI + FastAPI (Python 3.11) + MySQL 8 + Docker + Nginx

## Implementation Plan

### Phase 1: Project Setup & Infrastructure (30min)
- [x] Create project structure and scaffold files
- [ ] Set up Docker containers (API, DB, Web, Nginx, Backup)
- [ ] Configure environment variables and networking
- [ ] Verify basic connectivity (API docs at /api/docs)

### Phase 2: Database & Backend Core (45min)
- [ ] Set up SQLAlchemy models and Alembic migrations
- [ ] Implement JWT-based PIN authentication
- [ ] Create basic CRUD endpoints for core entities
- [ ] Add database seeding with sample data
- [ ] Set up logging and error handling

### Phase 3: Core Transaction Features (60min)
- [ ] Transaction creation with itemized lines
- [ ] Split ratio functionality (default 50/50, customizable)
- [ ] Category and account management
- [ ] Basic validation and business logic
- [ ] Receipt upload with file storage

### Phase 4: Frontend Foundation (45min)
- [ ] React app with MUI theme and routing
- [ ] Authentication flow with PIN login
- [ ] Basic layout with navigation
- [ ] API client setup with React Query
- [ ] Form components with validation

### Phase 5: Transaction UI (60min)
- [ ] Transaction list with filtering and pagination
- [ ] Transaction creation form with dynamic items
- [ ] Dashboard with monthly overview
- [ ] Category and account management pages
- [ ] Split ratio controls

### Phase 6: Advanced Features (45min)
- [ ] CSV import/export with validation preview
- [ ] Budget management and tracking
- [ ] Reports (monthly, trends, split analysis)
- [ ] Receipt image handling
- [ ] Search and filtering

### Phase 7: Testing & Quality (30min)
- [ ] API tests with pytest
- [ ] Frontend component tests with RTL/Vitest
- [ ] E2E test with Playwright
- [ ] Linting and formatting setup

### Phase 8: Documentation & Deployment (15min)
- [ ] Complete README with setup instructions
- [ ] API documentation review
- [ ] Backup/restore procedures
- [ ] Production deployment notes

## Key Files to Create

### Root Level
- `docker-compose.yml` - Multi-service setup
- `.env.example` - Environment template
- `Makefile` - Development commands
- `README.md` - Setup and usage guide

### Backend (/api)
- `Dockerfile` - Python API container
- `pyproject.toml` - Dependencies and config
- `app/main.py` - FastAPI application
- `app/models.py` - SQLAlchemy models
- `app/schemas.py` - Pydantic schemas
- `app/routers/` - API endpoints
- `alembic/` - Database migrations

### Frontend (/web)
- `Dockerfile` - React build container
- `package.json` - NPM dependencies
- `vite.config.ts` - Build configuration
- `src/pages/` - Main application pages
- `src/components/` - Reusable components
- `src/api/` - Backend integration

### Infrastructure
- `nginx/default.conf` - Reverse proxy config
- `backup/backup.sh` - Database backup script

## Success Criteria
1. `docker-compose up -d` starts all services
2. http://localhost shows working dashboard
3. Login with PIN works
4. Create transaction with split ratio
5. CSV import/export functional
6. Receipt upload working
7. All tests pass
8. Complete documentation

## Development Workflow
1. Small, focused commits per feature
2. Test each component as built
3. Document as you go
4. Keep containers running for fast iteration

Let's build this step by step!
