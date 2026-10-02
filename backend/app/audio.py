from pathlib import Path

from tinytag import TinyTag

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AudioNote
from app.services.storage_service import upload_audio_file


router = APIRouter(
    prefix="/api/audio",
    tags=["Audio"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


ALLOWED_EXTENSIONS = {
    ".mp3",
    ".wav",
    ".m4a",
    ".mp4",
    ".webm",
    ".ogg",
    ".flac",
}


@router.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided",
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {extension}",
        )

    try:
        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty",
            )

        # Create the database record first so we get an ID.
        audio_note = AudioNote(
            original_filename=file.filename,
            file_size=len(contents),
            status="UPLOADED",
        )

        db.add(audio_note)
        db.commit()
        db.refresh(audio_note)

        # Temporary local file used to inspect the audio
        # and upload it to Supabase Storage.
        local_file_path = (
            UPLOAD_DIR / f"{audio_note.id}{extension}"
        )

        with open(local_file_path, "wb") as audio_file:
            audio_file.write(contents)

        # Read audio duration from the temporary local file.
        try:
            tag = TinyTag.get(str(local_file_path))
            audio_note.duration_seconds = tag.duration
        except Exception:
            audio_note.duration_seconds = None

        # Store the file permanently in Supabase Storage.
        storage_path = f"audio/{audio_note.id}{extension}"

        upload_audio_file(
            str(local_file_path),
            storage_path,
        )

        # PostgreSQL now stores the Supabase storage path,
        # not the local filesystem path.
        audio_note.storage_path = storage_path
        audio_note.status = "QUEUED"

        db.commit()
        db.refresh(audio_note)

        # The permanent copy is now in Supabase.
        # Remove the temporary local copy.
        try:
            local_file_path.unlink()
        except Exception:
            pass

        return {
            "id": audio_note.id,
            "filename": audio_note.original_filename,
            "status": audio_note.status,
            "file_size": audio_note.file_size,
            "duration_seconds": audio_note.duration_seconds,
            "storage_path": audio_note.storage_path,
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )


@router.get("")
def get_audio_notes(
    db: Session = Depends(get_db),
):
    notes = (
        db.query(AudioNote)
        .order_by(AudioNote.created_at.desc())
        .all()
    )

    return [
        {
            "id": note.id,
            "filename": note.original_filename,
            "status": note.status,
            "file_size": note.file_size,
            "duration_seconds": note.duration_seconds,
            "created_at": note.created_at,
        }
        for note in notes
    ]


@router.get("/{audio_id}")
def get_audio_note(
    audio_id: int,
    db: Session = Depends(get_db),
):
    note = db.get(AudioNote, audio_id)

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Audio note not found",
        )

    return {
        "id": note.id,
        "filename": note.original_filename,
        "status": note.status,
        "file_size": note.file_size,
        "duration_seconds": note.duration_seconds,
        "transcript": note.transcript,
        "summary": note.summary,
        "error_message": note.error_message,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }