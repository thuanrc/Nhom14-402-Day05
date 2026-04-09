from functools import lru_cache
from typing import Annotated

from fastapi import Depends, FastAPI, File, UploadFile

from app.config import Settings, get_settings
from app.schemas import VideoChatRequest, VideoChatResponse, VideoQuestionResponse
from app.services.openai_service import OpenAIQuestionService

app = FastAPI(
    title="Interactive Video Question Generator",
    version="0.1.0",
    description=(
        "Upload a lesson video, transcribe it with OpenAI timestamped segments, "
        "generate structured checkpoints, then answer follow-up questions using the saved transcript."
    ),
)


@lru_cache
def get_question_service() -> OpenAIQuestionService:
    settings = get_settings()
    return OpenAIQuestionService(settings)


@app.get("/health")
def health_check(settings: Annotated[Settings, Depends(get_settings)]) -> dict[str, str]:
    return {
        "status": "ok",
        "transcription_model": settings.openai_transcription_model,
        "question_model": settings.openai_question_model,
        "transcript_store_dir": str(settings.transcript_store_dir),
    }


@app.post(
    "/api/v1/questions/from-video",
    response_model=VideoQuestionResponse,
    response_model_exclude_none=True,
    summary="Upload a video and generate transcript, checkpoints, and chatbot config",
)
async def generate_questions_from_video(
    video: Annotated[UploadFile, File(description="Lesson video file")],
    service: OpenAIQuestionService = Depends(get_question_service),
) -> VideoQuestionResponse:
    return await service.generate_questions_from_video(video=video)


@app.post(
    "/api/v1/videos/{video_id}/chat",
    response_model=VideoChatResponse,
    summary="Ask a question about a previously ingested video",
)
async def chat_with_video(
    video_id: str,
    payload: VideoChatRequest,
    service: OpenAIQuestionService = Depends(get_question_service),
) -> VideoChatResponse:
    return await service.answer_video_question(video_id=video_id, question=payload.question)
