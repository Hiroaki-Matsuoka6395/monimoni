from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from .settings import settings
from .routers import auth, transactions, transactions_debug, categories, accounts, users, budgets, reports, files

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="monimoni Family Budget API",
    description="API for managing family budget and expenses",
    version="1.0.0"
)

# Add security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*"] if settings.DEBUG else ["localhost"]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Add request logging middleware


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(
        "%s %s - Status: %s - Time: %.4fs",
        request.method, request.url.path, response.status_code, process_time
    )
    return response

# Exception handlers


@app.exception_handler(404)
async def not_found_handler(_request: Request, _exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(_request: Request, exc):
    logger.error("Internal server error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(transactions_debug.router, prefix="/api/debug", tags=["Debug"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])

# Health check endpoint


@app.get("/healthz", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    try:
        # Basic health check - can be extended with database connectivity
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": "0.1.0"
        }
    except ConnectionError as e:
        logger.error("Health check failed: %s", e)
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }
        )

# Root endpoint


@app.get("/", response_model=dict)
async def root():
    """Root endpoint returning application information."""
    return {
        "message": "monimoni Family Budget API",
        "version": "1.0.0",
        "status": "active"
    }
