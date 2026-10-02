import time
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models import AudioNote

from app.services.gnani_service import transcribe_audio

from app.services.gnani_batch_service import (
    create_batch_job,
    start_batch_job,
    wait_for_batch_completion,
    get_batch_transcript,
)

from app.services.summary_service import generate_summary

from app.services.storage_service import download_audio_file


def get_next_job():
    """
    Find the oldest queued audio job.

    SELECT ... FOR UPDATE SKIP LOCKED prevents two worker
    processes from picking up the same job.
    """

    db = SessionLocal()

    try:
        job = (
            db.execute(
                select(AudioNote)
                .where(AudioNote.status == "QUEUED")
                .order_by(AudioNote.created_at)
                .with_for_update(skip_locked=True)
            )
            .scalars()
            .first()
        )

        if not job:
            return None

        job.status = "TRANSCRIBING"

        db.commit()

        return job.id

    finally:
        db.close()


def process_batch_transcription(
    job_id: int,
    db,
    temp_file_path: str,
):
    """
    Process long audio using the Gnani Batch API.

    We intentionally perform each Batch step separately so that
    the Gnani job ID can be saved to PostgreSQL immediately.

    Flow:

        Create job
            ↓
        Save Gnani job ID
            ↓
        Start job
            ↓
        Wait for completion
            ↓
        Retrieve transcript
    """

    print("Creating Gnani Batch job...")

    gnani_job_id = create_batch_job(
        file_path=temp_file_path,
        language_code="en-IN",
    )

    print(
        f"Gnani Batch job created: {gnani_job_id}"
    )

    # Save the Gnani job ID immediately.
    #
    # This is important because even if transcript retrieval
    # fails later, we still know which Gnani job to recover.
    job = db.get(AudioNote, job_id)

    if not job:
        raise RuntimeError(
            f"Audio note {job_id} not found."
        )

    job.gnani_job_id = gnani_job_id

    db.commit()

    print(
        f"Saved Gnani job ID for audio note {job_id}."
    )

    print("Starting Gnani Batch job...")

    start_batch_job(gnani_job_id)

    print("Waiting for Gnani Batch job...")

    wait_for_batch_completion(gnani_job_id)

    print("Gnani Batch job completed.")

    # get_batch_transcript() already handles 429 responses
    # with retry/backoff.
    print("Getting Batch transcript...")

    transcript = get_batch_transcript(
        gnani_job_id
    )

    print(
        "Gnani Batch transcript retrieved successfully."
    )

    return transcript


def process_job(job_id: int):
    """
    Process one queued audio note from start to finish.
    """

    db = SessionLocal()

    temp_file_path = None

    try:
        job = db.get(AudioNote, job_id)

        if not job:
            print(
                f"Job {job_id} not found."
            )
            return

        print(
            f"Transcribing job: {job_id}"
        )

        print(
            f"Storage path: {job.storage_path}"
        )

        if not job.storage_path:
            raise RuntimeError(
                "Audio note does not have a storage path."
            )

        # --------------------------------------------------
        # Download audio from Supabase
        # --------------------------------------------------

        extension = Path(
            job.storage_path
        ).suffix

        temp_file_path = (
            f"uploads/worker_{job.id}{extension}"
        )

        print(
            "Downloading audio from Supabase Storage..."
        )

        download_audio_file(
            job.storage_path,
            temp_file_path,
        )

        print(
            f"Audio downloaded to: {temp_file_path}"
        )

        # --------------------------------------------------
        # Choose transcription method
        # --------------------------------------------------

        if (
            job.duration_seconds is not None
            and job.duration_seconds > 30
        ):

            print(
                f"Audio duration is "
                f"{job.duration_seconds:.2f} seconds."
            )

            print(
                "Using Gnani Batch API for long audio."
            )

            transcript = process_batch_transcription(
                job_id=job.id,
                db=db,
                temp_file_path=temp_file_path,
            )

        else:

            print(
                f"Audio duration is "
                f"{job.duration_seconds or 0:.2f} seconds."
            )

            print(
                "Using Gnani REST API."
            )

            transcript = transcribe_audio(
                temp_file_path,
                language_code="en-IN",
            )

        # --------------------------------------------------
        # Save transcript
        # --------------------------------------------------

        job = db.get(AudioNote, job_id)

        if not job:
            raise RuntimeError(
                f"Audio note {job_id} disappeared."
            )

        job.transcript = transcript
        job.status = "SUMMARIZING"
        job.error_message = None

        db.commit()

        print(
            f"Job {job_id} transcription completed."
        )

        # --------------------------------------------------
        # Generate summary
        # --------------------------------------------------

        print(
            f"Generating summary for job: {job_id}"
        )

        summary = generate_summary(
            transcript
        )

        # --------------------------------------------------
        # Save final result
        # --------------------------------------------------

        job = db.get(AudioNote, job_id)

        if not job:
            raise RuntimeError(
                f"Audio note {job_id} disappeared."
            )

        job.summary = summary
        job.status = "COMPLETED"
        job.error_message = None

        db.commit()

        print(
            f"Job {job_id} completed successfully."
        )

    except Exception as e:

        db.rollback()

        job = db.get(
            AudioNote,
            job_id,
        )

        if job:

            job.status = "FAILED"
            job.error_message = str(e)

            db.commit()

        print(
            f"Job {job_id} failed: {e}"
        )

    finally:

        # --------------------------------------------------
        # Delete temporary local audio
        # --------------------------------------------------

        if temp_file_path:

            try:

                temp_path = Path(
                    temp_file_path
                )

                if temp_path.exists():

                    temp_path.unlink()

                    print(
                        f"Temporary file deleted: "
                        f"{temp_file_path}"
                    )

            except Exception as cleanup_error:

                print(
                    "Could not delete temporary file: "
                    f"{cleanup_error}"
                )

        db.close()


def worker_loop():
    """
    Continuously look for queued audio jobs.
    """

    print(
        "Audio processing worker started."
    )

    while True:

        job_id = get_next_job()

        if job_id is None:

            time.sleep(3)

            continue

        print(
            f"Picked up audio job: {job_id}"
        )

        process_job(job_id)


if __name__ == "__main__":
    worker_loop()