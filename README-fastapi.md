# Interactive Video Question API

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Environment

```env
OPENAI_API_KEY=...
OPENAI_TRANSCRIPTION_MODEL=whisper-1
OPENAI_TRANSCRIPTION_MAX_FILE_BYTES=26214400
OPENAI_QUESTION_MODEL=gpt-5-mini
TRANSCRIPT_STORE_DIR=data/transcripts
```

## API flow

1. Teacher uploads a lesson video to `/api/v1/questions/from-video`.
2. The backend sends the uploaded file to OpenAI Transcriptions with segment timestamps.
3. The backend reformats transcript segments into a timestamped prompt.
4. OpenAI generates `video_title` and `checkpoints` as structured output.
5. The backend generates a UUID `video_id`, stores transcript metadata in `data/transcripts/{video_id}.json`, and returns the merged response.
6. Later, the chat API loads the stored transcript by `video_id` and uses it as context for question answering.

## Notes

- The current transcription endpoint is configured with a 25 MB upload limit by default.
- Transcripts are stored outside `app/` by default in `data/transcripts/`.
- `multiple_choice` checkpoints return `options`, `correct_answer`, and `explanation`.
- `essay` checkpoints return `keywords`, `hint`, and `grading_criteria`.
- Fields that do not apply to a checkpoint type are omitted from the API response.

## Example ingest request

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/questions/from-video" \
  -F "video=@sample-lesson.mp4"
```

## Example chat request

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/videos/VIDEO_ID/chat" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"Nguyen nhan chinh cua su kien nay la gi?\"}"
```
