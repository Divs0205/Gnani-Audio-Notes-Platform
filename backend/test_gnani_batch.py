from app.services.gnani_batch_service import transcribe_audio_batch


file_path = "uploads/13.mp3"

print("Starting Batch transcription test...")

transcript, job_id = transcribe_audio_batch(
    file_path,
    language_code="en-IN",
)

print("\nBatch job ID:")
print(job_id)

print("\nTranscript:")
print(transcript)