from app.services.gnani_service import transcribe_audio


result = transcribe_audio(
    "uploads/2.m4a",
    language_code="en-IN",
)

print("\n==============================")
print("TRANSCRIPT")
print("==============================")
print(result)
print("==============================\n")