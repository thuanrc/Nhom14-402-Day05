import asyncio
import json
import tempfile
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from openai import AsyncOpenAI

from app.config import Settings
from app.prompts.question_generation_prompt import (
    OPENAI_TRANSCRIPTION_PROMPT,
    QUESTION_GENERATION_SYSTEM_PROMPT,
    build_chatbot_system_prompt,
    build_question_generation_user_prompt,
    build_video_qa_system_prompt,
    build_video_qa_user_prompt,
)
from app.schemas import (
    ChatbotConfig,
    QuestionGenerationPayload,
    StoredVideoTranscript,
    VideoChatResponse,
    VideoQuestionResponse,
)


class OpenAIQuestionService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.transcript_store_dir = settings.transcript_store_dir
        self.transcript_store_dir.mkdir(parents=True, exist_ok=True)

    async def generate_questions_from_video(
        self,
        *,
        video: UploadFile,
    ) -> VideoQuestionResponse:
        temp_path = await self._persist_upload(video)

        try:
            self._validate_transcription_size(temp_path)
            transcription = await self._transcribe_with_openai(temp_path)

            transcript = self._extract_transcript_text(transcription)
            timestamped_segments = self._format_segments_for_prompt(transcription)

            fallback_title = self._derive_fallback_title(video.filename)
            question_payload = await self._generate_structured_questions(
                transcript=transcript,
                timestamped_segments=timestamped_segments,
                fallback_title=fallback_title,
            )

            video_title = question_payload.video_title.strip() or fallback_title
            video_id = str(uuid.uuid4())
            chatbot_config = self._build_chatbot_config(video_title=video_title, transcript=transcript)
            response = VideoQuestionResponse(
                video_id=video_id,
                video_title=video_title,
                transcript=transcript,
                checkpoints=question_payload.checkpoints,
                chatbot_config=chatbot_config,
            )
            await self._save_transcript_record(
                StoredVideoTranscript(
                    video_id=video_id,
                    video_title=video_title,
                    transcript=transcript,
                    chatbot_config=chatbot_config,
                )
            )
            return response
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Question generation pipeline failed: {exc}",
            ) from exc
        finally:
            if temp_path.exists():
                temp_path.unlink()

    async def answer_video_question(self, *, video_id: str, question: str) -> VideoChatResponse:
        record = await self._load_transcript_record(video_id)
        answer = await self._generate_answer_from_transcript(record=record, question=question)
        return VideoChatResponse(
            video_id=record.video_id,
            video_title=record.video_title,
            question=question,
            answer=answer,
        )

    async def _persist_upload(self, video: UploadFile) -> Path:
        suffix = Path(video.filename or "lesson.mp4").suffix or ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            while chunk := await video.read(1024 * 1024):
                temp_file.write(chunk)
            temp_path = Path(temp_file.name)

        return temp_path

    def _validate_transcription_size(self, temp_path: Path) -> None:
        file_size = temp_path.stat().st_size
        if file_size > self.settings.openai_transcription_max_file_bytes:
            max_mb = self.settings.openai_transcription_max_file_bytes / (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=(
                    f"Uploaded video is too large for the OpenAI transcription endpoint. "
                    f"Current limit is {max_mb:.0f} MB."
                ),
            )

    async def _transcribe_with_openai(self, temp_path: Path):
        with temp_path.open("rb") as video_file:
            return await self.openai_client.audio.transcriptions.create(
                model=self.settings.openai_transcription_model,
                file=video_file,
                prompt=OPENAI_TRANSCRIPTION_PROMPT,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

    def _extract_transcript_text(self, transcription) -> str:
        transcript = (getattr(transcription, "text", "") or "").strip()
        if not transcript:
            raise HTTPException(status_code=502, detail="OpenAI returned an empty transcript for the uploaded video.")
        return transcript

    def _format_segments_for_prompt(self, transcription) -> str:
        segments = getattr(transcription, "segments", None) or []
        if not segments:
            raise HTTPException(status_code=502, detail="OpenAI transcription did not return segment timestamps.")

        lines: list[str] = []
        for segment in segments:
            start = int(getattr(segment, "start", 0) or 0)
            end = int(getattr(segment, "end", 0) or 0)
            text = (getattr(segment, "text", "") or "").strip()
            if not text:
                continue
            lines.append(f"[{start}-{end}] {text}")

        if not lines:
            raise HTTPException(status_code=502, detail="OpenAI transcription segments were empty.")

        return "\n".join(lines)

    async def _generate_structured_questions(
        self,
        *,
        transcript: str,
        timestamped_segments: str,
        fallback_title: str,
    ) -> QuestionGenerationPayload:
        user_prompt = build_question_generation_user_prompt(
            transcript=transcript,
            timestamped_segments=timestamped_segments,
            fallback_title=fallback_title,
        )

        response = await self.openai_client.responses.parse(
            model=self.settings.openai_question_model,
            input=[
                {"role": "system", "content": QUESTION_GENERATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            text_format=QuestionGenerationPayload,
        )
        parsed = getattr(response, "output_parsed", None)
        if not parsed:
            raise HTTPException(status_code=502, detail="OpenAI did not return a structured question payload.")
        return parsed

    async def _generate_answer_from_transcript(
        self,
        *,
        record: StoredVideoTranscript,
        question: str,
    ) -> str:
        response = await self.openai_client.responses.create(
            model=self.settings.openai_question_model,
            input=[
                {
                    "role": "system",
                    "content": build_video_qa_system_prompt(
                        video_title=record.video_title,
                        base_system_prompt=record.chatbot_config.system_prompt,
                    ),
                },
                {
                    "role": "user",
                    "content": build_video_qa_user_prompt(
                        video_title=record.video_title,
                        transcript=record.transcript,
                        question=question,
                    ),
                },
            ],
        )
        answer = getattr(response, "output_text", "").strip()
        if not answer:
            raise HTTPException(status_code=502, detail="OpenAI returned an empty answer for the video question.")
        return answer

    def _derive_fallback_title(self, filename: str | None) -> str:
        if filename:
            raw_title = Path(filename).stem
            normalized_title = raw_title.replace("_", " ").replace("-", " ").strip()
            if normalized_title:
                return normalized_title
        return "video bai giang"

    def _build_chatbot_config(self, *, video_title: str, transcript: str) -> ChatbotConfig:
        return ChatbotConfig(
            system_prompt=build_chatbot_system_prompt(video_title=video_title),
            context_summary=self._build_context_summary(video_title=video_title, transcript=transcript),
        )

    def _build_context_summary(self, *, video_title: str, transcript: str) -> str:
        compact_transcript = " ".join(transcript.split())
        excerpt = compact_transcript[:240].rstrip(" ,;:")
        if len(compact_transcript) > 240:
            excerpt = f"{excerpt}..."
        return f'Video "{video_title}" tap trung vao: {excerpt}'

    async def _save_transcript_record(self, record: StoredVideoTranscript) -> None:
        path = self._record_path(record.video_id)
        payload = record.model_dump()
        await self._write_json(path, payload)

    async def _load_transcript_record(self, video_id: str) -> StoredVideoTranscript:
        path = self._record_path(video_id)
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Transcript for video_id '{video_id}' was not found.")

        data = await self._read_json(path)
        return StoredVideoTranscript.model_validate(data)

    def _record_path(self, video_id: str) -> Path:
        return self.transcript_store_dir / f"{video_id}.json"

    async def _write_json(self, path: Path, payload: dict) -> None:
        await self._run_in_thread(self._write_json_sync, path, payload)

    async def _read_json(self, path: Path) -> dict:
        return await self._run_in_thread(self._read_json_sync, path)

    async def _run_in_thread(self, fn, *args):
        return await asyncio.to_thread(fn, *args)

    @staticmethod
    def _write_json_sync(path: Path, payload: dict) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as file_obj:
            json.dump(payload, file_obj, ensure_ascii=False, indent=2)

    @staticmethod
    def _read_json_sync(path: Path) -> dict:
        with path.open("r", encoding="utf-8") as file_obj:
            return json.load(file_obj)
