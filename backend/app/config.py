import os
from pathlib import Path
from dataclasses import dataclass

from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(ENV_FILE)


@dataclass
class Settings:
    app_name: str
    database_url: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    firebase_api_key: str
    cors_origins: list[str]


def _parse_cors(value: str) -> list[str]:
    if not value:
        return ["*"]
    origins = [origin.strip() for origin in value.split(',') if origin.strip()]
    return origins or ["*"]


settings = Settings(
    app_name=os.getenv('APP_NAME', 'SetuSathi Backend API'),
    database_url=os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:postgres@localhost:5432/setusathi'),
    secret_key=os.getenv('SECRET_KEY', 'change-me'),
    algorithm=os.getenv('ALGORITHM', 'HS256'),
    access_token_expire_minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '480')),
    firebase_api_key=os.getenv('FIREBASE_API_KEY', ''),
    cors_origins=_parse_cors(os.getenv('CORS_ORIGINS', '*')),
)
