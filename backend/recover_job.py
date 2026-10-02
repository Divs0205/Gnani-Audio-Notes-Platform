from app.database import SessionLocal
from app.models import AudioNote
from app.services.gnani_batch_service import get_batch_transcript
from app.services.summary_service import generate_summary


AUDIO_NOTE_ID = 15

GNANI_JOB_ID = "01a0fc5d-a61f-7521-82aa-85a54da8bc10"


def recover_job():
    db = SessionLocal()

    try:
        job = db.get(AudioNote, AUDIO_NOTE_ID)

        if not job:
            print(f"Audio note {AUDIO_NOTE_ID} not found.")
            return

        print(f"Recovering audio note {AUDIO_NOTE_ID}")
        print(f"Gnani Batch job: {GNANI_JOB_ID}")

        print("Getting transcript from completed Gnani job...")

        transcript = get_batch_transcript(
            GNANI_JOB_ID
        )

        print("Transcript retrieved successfully.")

        job.gnani_job_id = GNANI_JOB_ID
        job.transcript = transcript
        job.status = "SUMMARIZING"
        job.error_message = None

        db.commit()

        print("Generating summary...")

        summary = generate_summary(transcript)

        job.summary = summary
        job.status = "COMPLETED"
        job.error_message = None

        db.commit()

        print("===================================")
        print("Job recovered successfully!")
        print(f"Audio note ID: {AUDIO_NOTE_ID}")
        print("Status: COMPLETED")
        print("===================================")

    except Exception as e:
        db.rollback()

        print("Recovery failed:")
        print(e)

    finally:
        db.close()


if __name__ == "__main__":
    recover_job()