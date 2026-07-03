from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    N8N_WEBHOOK_BASE_URL: str = "http://n8n:5678/webhook"
    HERMES_API_KEY: str = ""
    HERMES_BASE_URL: str = "https://api.nousresearch.com/v1"
    HERMES_MODEL: str = "nous-hermes-3"
    NANO_BANANA_API_KEY: str = ""
    SECRET_KEY: str = "changeme"


settings = Settings()