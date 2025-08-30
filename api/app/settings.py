from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings."""

    # Database
    DATABASE_URL: str = "mysql+aiomysql://app:app_password@db:3306/family_budget"

    # Security
    APP_SECRET: str = "your-secret-key-change-in-production"
    HOUSEHOLD_PIN: str = "1234"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    # File Upload
    UPLOAD_DIR: str = "/data/receipts"
    MAX_UPLOAD_MB: int = 5
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "pdf"]

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost"
    CORS_ALLOWED_ORIGINS: str = "http://localhost,http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated string to list."""
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",")]

    # Application
    DEBUG: bool = True
    TIMEZONE: str = "Asia/Tokyo"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
