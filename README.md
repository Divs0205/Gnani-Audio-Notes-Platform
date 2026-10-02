# Gnani Audio Notes Platform

A simple web app that turns audio recordings into useful notes.

You upload an audio file, the platform transcribes it using Gnani's speech-to-text APIs, generates a structured summary with Gemini, and keeps the result available in your history.

The project was built as an end-to-end take-home application with a focus on a clean user experience, background processing, and an architecture that can be extended later.

## Live Demo

**Frontend:** https://gnani-audio-notes-platform.vercel.app/

**Backend API:** https://gnani-audio-notes-platform.onrender.com/

**API Docs:** https://gnani-audio-notes-platform.onrender.com/docs

**GitHub:** https://github.com/Divs0205/Gnani-Audio-Notes-Platform

---

## What it does

The flow is intentionally simple:

1. Upload an audio recording.
2. The backend stores the original file in Supabase Storage.
3. A processing job is placed in PostgreSQL.
4. A background worker picks up the job.
5. The worker chooses the appropriate Gnani transcription API based on audio duration.
6. The transcript is saved in PostgreSQL.
7. Gemini turns the transcript into a structured summary.
8. The transcript and summary are shown in the frontend.
9. Previous recordings can be opened again from the History page.

The browser does not have to keep one long request open while the audio is being processed.

---

## Processing flow

Audio processing is treated as a background job:

```text
Upload
  ↓
QUEUED
  ↓
TRANSCRIBING
  ↓
SUMMARIZING
  ↓
COMPLETED
```

If something goes wrong:

```text
Any processing step
  ↓
FAILED
  ↓
Error stored and shown to the user
```

This gives the frontend a clear way to show progress and makes longer-running work easier to handle.

---

## Architecture

```text
                    ┌──────────────────────┐
                    │   Next.js Frontend   │
                    │       Vercel         │
                    └──────────┬───────────┘
                               │
                               │ HTTP API
                               ▼
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    │       Render         │
                    └──────┬───────┬───────┘
                           │       │
                ┌──────────┘       └─────────────┐
                ▼                                ▼
       ┌─────────────────┐              ┌─────────────────┐
       │   PostgreSQL    │              │ Supabase Storage│
       │ Jobs + metadata │              │  Audio files    │
       └────────┬────────┘              └────────┬────────┘
                │                                │
                └──────────────┬─────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Background Worker    │
                    │  PostgreSQL queue    │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    ▼                      ▼
             ┌────────────┐        ┌────────────┐
             │  Gnani ASR │        │   Gemini   │
             │ Transcribe │        │  Summary   │
             └────────────┘        └────────────┘
```

### Main responsibilities

**Next.js**
- Upload interface
- Processing status
- Transcript and summary display
- History
- Architecture page

**FastAPI**
- Accepts uploads
- Creates audio-note records
- Provides status/result APIs
- Starts the background worker

**PostgreSQL**
- Stores job state and metadata
- Stores transcripts and summaries
- Acts as the lightweight job queue

**Supabase Storage**
- Stores the original audio files
- Keeps binary audio separate from relational data

**Background worker**
- Finds queued jobs
- Downloads audio from storage
- Calls Gnani
- Calls Gemini
- Updates the database
- Handles failures and temporary-file cleanup

---

## Long audio handling

The application uses two transcription paths.

### Short audio

For audio up to 30 seconds:

```text
Audio
 ↓
Gnani REST STT API
 ↓
Transcript
```

### Long audio

For audio longer than 30 seconds:

```text
Audio
 ↓
Gnani Batch API
 ↓
Create job
 ↓
Start job
 ↓
Poll status
 ↓
Retrieve transcript
```

The Batch flow is useful for longer recordings because the application does not need to keep one synchronous HTTP request open while Gnani processes the audio.

The worker also handles rate limiting from the Batch API using `Retry-After` when available, with bounded backoff when necessary.

---

## Database design

The main table is `audio_notes`.

It stores information such as:

- `id`
- original filename
- storage path
- file size
- duration
- processing status
- transcript
- summary
- Gnani batch job ID
- error message
- created/updated timestamps

Simplified:

```text
audio_notes
────────────────────────────────
id
original_filename
storage_path
file_size
duration_seconds
status
transcript
summary
error_message
gnani_job_id
created_at
updated_at
```

The database contains application state, while Supabase Storage contains the actual audio files.

---

## Processing states

| Status | Meaning |
|---|---|
| `UPLOADED` | File has been received |
| `QUEUED` | Waiting for the worker |
| `TRANSCRIBING` | Audio is being transcribed |
| `SUMMARIZING` | Transcript is being summarized |
| `COMPLETED` | Transcript and summary are ready |
| `FAILED` | Processing stopped because of an error |

The frontend maps these states to progress indicators instead of assuming that processing is complete.

---

## Concurrency and job claiming

The worker uses PostgreSQL row locking when claiming a job:

```python
.with_for_update(skip_locked=True)
```

This matters if multiple workers are running.

A worker locks a queued row before changing its state to `TRANSCRIBING`. `skip_locked=True` allows another worker to skip rows already locked by a different worker.

For the current take-home deployment, one worker runs alongside the FastAPI service. The same job lifecycle can later be moved to dedicated workers.

---

## Failure handling

Failures are treated as part of the normal application flow.

If transcription, batch polling, storage access, or summarization raises an exception:

1. The database transaction is rolled back where appropriate.
2. The job is marked as `FAILED`.
3. The error message is stored.
4. Temporary downloaded audio is cleaned up.
5. The frontend can show that processing failed.

This also makes debugging easier because the failure belongs to the specific audio-note record.

---

## Project structure

```text
Gnani-Audio-Notes-Platform/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── audio.py
│   │   ├── worker.py
│   │   ├── recover_job.py
│   │   └── services/
│   │       ├── gnani_service.py
│   │       ├── gnani_batch_service.py
│   │       ├── summary_service.py
│   │       └── storage_service.py
│   ├── alembic/
│   ├── uploads/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── history/
│   │   └── architecture/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## Tech stack

### Frontend
- Next.js
- React
- TypeScript
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic

### Database
- PostgreSQL

### Storage
- Supabase Storage

### AI / APIs
- Gnani Vachana STT
- Gemini

### Deployment
- Vercel — frontend
- Render — backend
- Supabase — database and storage services

---

## API

The complete interactive API documentation is available through FastAPI's Swagger UI:

https://gnani-audio-notes-platform.onrender.com/docs

The main application flow is built around:

```text
POST  /api/audio
GET   /api/audio
GET   /api/audio/{id}
```

The upload endpoint creates an audio-note record and queues it for background processing.

The detail endpoint can be used to check the current state and retrieve the transcript and summary once processing is complete.

---

## Running locally

### 1. Clone the repository

```bash
git clone https://github.com/Divs0205/Gnani-Audio-Notes-Platform.git
cd Gnani-Audio-Notes-Platform
```

### 2. Backend

```bash
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` from `.env.example`:

```env
DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/gnani_audio_notes

GNANI_API_KEY=your_gnani_api_key
GEMINI_API_KEY=your_gemini_api_key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key
SUPABASE_BUCKET=audio-files
```

Run migrations:

```bash
alembic upgrade head
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start Next.js:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Environment variables

### Backend

```env
DATABASE_URL=
GNANI_API_KEY=
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET=
```

### Frontend

```env
NEXT_PUBLIC_API_URL=
```

API keys should never be committed to GitHub.

Only placeholder values belong in `.env.example`.

---

## Deployment

The deployed setup separates the frontend and backend:

```text
Vercel
  └── Next.js frontend

Render
  └── FastAPI + background worker

Supabase
  ├── PostgreSQL
  └── Audio storage
```

The frontend receives the Render backend URL through:

```env
NEXT_PUBLIC_API_URL
```

The backend uses CORS to allow requests from the public frontend.

---

## Design decisions

### Why Supabase Storage instead of PostgreSQL for audio?

PostgreSQL is useful for structured application data, but audio files are binary objects and can become large.

Keeping files in object storage means the database only needs to store a reference such as:

```text
audio/14.m4a
```

### Why PostgreSQL as the job queue?

For this take-home project, PostgreSQL was already required and provides reliable transactional state.

It avoids adding another infrastructure dependency just to coordinate a relatively small workload.

For a larger production system, a dedicated queue such as Redis, SQS, or another managed job system would be a natural next step.

### Why not process everything synchronously?

A long transcription request can take much longer than a normal API request.

Using a background job means the upload endpoint can return quickly while processing continues independently.

### Why two Gnani transcription paths?

The REST API is convenient for short audio, while the Batch API is better suited to longer recordings. Selecting the path based on duration keeps the normal case simple without ignoring longer audio.

---

## Security notes

- API keys are stored in environment variables.
- `.env` files are ignored by Git.
- `.env.example` contains placeholders only.
- Audio files are kept in storage rather than committed to the repository.
- Private API credentials are never sent to the frontend.
- CORS is restricted to the application's known frontend origins.

---

## Future improvements

If this were developed further, I would consider:

1. **Dedicated background workers**
   - Move workers away from the FastAPI web process.
   - Scale workers independently.

2. **A dedicated queue**
   - Redis, SQS, or another managed queue could handle larger workloads more naturally.

3. **Authentication**
   - Give users their own private recording history.

4. **Better retry policies**
   - Retry transient storage/API failures while avoiding repeated processing of permanent failures.

5. **More advanced long-audio processing**
   - Support even larger recordings and more granular progress reporting.

6. **Observability**
   - Add structured logs, metrics, and error tracking.

7. **More audio formats**
   - Add validation and normalization for additional formats.

8. **Search**
   - Allow users to search through previous transcripts and summaries.

---

## A note on the implementation

The goal was not just to make an upload button call an AI API.

The main design consideration was keeping the responsibilities separate:

```text
Frontend
  → user interaction

FastAPI
  → API + job creation

PostgreSQL
  → application state

Supabase
  → file storage

Worker
  → long-running processing

Gnani
  → speech-to-text

Gemini
  → summarization
```

That separation makes the system easier to understand, debug, and extend.

---

## Author

Built by **Divit Sood** as a Gnani Innovations Audio Notes Platform take-home project.

GitHub:
https://github.com/Divs0205/Gnani-Audio-Notes-Platform
