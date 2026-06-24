from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    DATABASE_URL: str = "sqlite:///civicpulse.db"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    MODEL_FALLBACK_ORDER: List[str] = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite"
    ]

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()



