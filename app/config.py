from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")
    openai_transcription_model: str = Field(
        default="whisper-1",
        alias="OPENAI_TRANSCRIPTION_MODEL",
    )
    openai_transcription_max_file_bytes: int = Field(
        default=25 * 1024 * 1024,
        alias="OPENAI_TRANSCRIPTION_MAX_FILE_BYTES",
    )
    openai_question_model: str = Field(
        default="gpt-4o-mini",
        alias="OPENAI_QUESTION_MODEL",
    )
    transcript_store_dir: Path = Field(
        default=Path("data/transcripts"),
        alias="TRANSCRIPT_STORE_DIR",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        populate_by_name=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
