# MoneyMoni - Two-Person Household Budgeting App

A comprehensive full-stack budgeting application designed for couples to manage their finances with 50/50 split capabilities, receipt management, and CSV import/export.

## Features

- **Fast Transaction Input**: Quick entry with optional receipt upload and itemized lines
- **Monthly Dashboard**: Overview of income, expenses, budget progress, and recent transactions
- **Categories & Accounts**: Organize transactions by custom categories and payment methods
- **Budget Tracking**: Set monthly budgets and track progress with visual indicators
- **50/50 Split**: Default equal split with per-transaction override capability
- **Receipt Management**: Upload and store receipt images locally
- **CSV Import/Export**: Bulk data management with validation and error reporting
- **Simple Authentication**: Shared household PIN for local-only access
- **Audit Logging**: Complete transaction history and user activity tracking

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Material-UI
- **Backend**: FastAPI (Python 3.11) + SQLAlchemy + Alembic
- **Database**: MySQL 8.0
- **Infrastructure**: Docker + Docker Compose + Nginx
- **Testing**: Pytest (API) + Vitest/RTL (Frontend) + Playwright (E2E)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd monimoni
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env file with your preferred settings
   ```

3. **Start the application**
   ```bash
   make setup
   # Or manually:
   docker-compose up -d
   make migrate
   make seed
   ```

4. **Access the application**
   - Web interface: http://localhost
   - API documentation: http://localhost/api/docs
   - Default PIN: 1234 (change in .env)

## Development Commands

```bash
# Start all services
make up

# Stop all services
make down

# View logs
make logs        # All services
make api         # API only
make web         # Web only

# Database operations
make migrate     # Run migrations
make seed        # Seed sample data

# Testing
make test        # Run all tests
make test-api    # API tests only
make test-web    # Frontend tests only

# Code quality
make fmt         # Format code
make lint        # Lint code

# Utilities
make shell-api   # Shell into API container
make shell-db    # MySQL shell
make backup      # Manual backup
```

## API Documentation

The API provides comprehensive endpoints for:

- **Authentication** (`/auth/*`): PIN-based login/logout
- **Transactions** (`/transactions/*`): CRUD operations with filtering
- **Categories** (`/categories/*`): Category management
- **Accounts** (`/accounts/*`): Payment method management
- **Budgets** (`/budgets/*`): Budget setting and tracking
- **Reports** (`/reports/*`): Analytics and summaries
- **Files** (`/files/*`): Receipt upload and CSV import/export

Access the interactive API documentation at http://localhost/api/docs

## Database Schema

### Core Tables
- `households`: Family units
- `users`: Individual family members
- `accounts`: Payment methods (cash, bank, card, IC, other)
- `categories`: Expense/income categorization with hierarchy
- `transactions`: Financial transactions with split ratios
- `transaction_items`: Itemized transaction details
- `receipts`: Uploaded receipt files
- `budgets`: Monthly budget limits per category
- `audit_logs`: User activity tracking

### Key Features
- **Split Tracking**: Each transaction has configurable split ratios
- **Itemization**: Transactions can have multiple line items
- **Receipt Storage**: Files stored in Docker volumes
- **Audit Trail**: Complete history of all changes

## File Structure

```
monimoni/
├── api/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/     # API endpoints
│   │   ├── models.py    # SQLAlchemy models
│   │   ├── schemas.py   # Pydantic schemas
│   │   └── settings.py  # Configuration
│   ├── alembic/         # Database migrations
│   └── tests/           # API tests
├── web/                 # React frontend
│   ├── src/
│   │   ├── pages/       # Main application pages
│   │   ├── components/  # Reusable components
│   │   ├── hooks/       # Custom React hooks
│   │   └── api/         # Backend integration
│   └── tests/           # Frontend tests
├── nginx/               # Reverse proxy config
├── backup/              # Database backup scripts
└── docker-compose.yml   # Multi-service setup
```

## Data Import/Export

### CSV Import
Upload CSV files with transaction data. The system provides:
- **Dry run mode**: Preview changes without saving
- **Row-level validation**: Detailed error reporting
- **Template download**: Get the correct CSV format

### CSV Export
Download transaction data with customizable date ranges and filtering.

### Format
```csv
date,type,amount_total,account,category,payer,split_ratio,memo,items
2024-01-01,expense,1000.00,現金,食費,妻,0.50,"スーパー","りんご:300,パン:200"
```

## Backup & Recovery

### Automatic Backups
- Daily backups at 3:00 AM JST
- Retention: 7 days
- Stored in Docker volume: `db_backups`

### Manual Backup
```bash
make backup
```

### Restore
```bash
# Copy backup file to container and restore
docker-compose exec db mysql -u root -p[ROOT_PASSWORD] family_budget < backup.sql
```

## Security Notes

### Local Development
- Designed for local-only deployment
- Simple PIN-based authentication
- HTTP cookies for session management
- CORS restricted to frontend origin

### Production Considerations
- Use HTTPS and secure cookies
- Change default PIN and secrets
- Restrict network access
- Enable firewall rules
- Regular security updates

## Performance Targets

- **API Response Time**: <500ms for paginated lists (10k rows)
- **File Upload**: Up to 5MB receipt images
- **Database**: Optimized indexes for common queries
- **Frontend**: Lazy loading and virtualized lists

## Accessibility

- Keyboard navigation support
- WCAG AA compliance targets
- Material-UI accessibility defaults
- Screen reader friendly

## Internationalization

- Primary language: Japanese (ja)
- i18n-ready string management
- Date/currency formatting for Japan

## Testing Strategy

### API Tests (Pytest)
- Unit tests for business logic
- Integration tests for endpoints
- Database transaction testing
- CSV import/export validation

### Frontend Tests (Vitest + RTL)
- Component unit tests
- Form validation testing
- API integration mocking
- User interaction flows

### E2E Tests (Playwright)
- Happy path scenarios
- Transaction creation flow
- Login/logout functionality
- Cross-browser compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run quality checks: `make fmt lint test`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
1. Check the documentation
2. Review the API docs at `/api/docs`
3. Check existing GitHub issues
4. Create a new issue with detailed information

---

**MoneyMoni** - Making household budgeting simple and transparent for couples.
