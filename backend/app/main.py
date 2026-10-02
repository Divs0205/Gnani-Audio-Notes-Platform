from contextlib import asynccontextmanager
from threading import Thread

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.audio import router as audio_router
from app.worker import worker_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background audio-processing worker
    worker_thread = Thread(
        target=worker_loop,
        daemon=True,
        name="audio-worker",
    )

    worker_thread.start()

    print("Background audio worker started.")

    yield

    print("FastAPI application shutting down.")


app = FastAPI(
    title="Gnani Audio Notes API",
    description="Backend API for the Gnani Audio Notes Platform",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://gnani-audio-notes-platform-29fosf04j-divs0205.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(audio_router)


@app.get("/")
def root():
    return {"message": "Gnani Audio Notes API is running"}


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }