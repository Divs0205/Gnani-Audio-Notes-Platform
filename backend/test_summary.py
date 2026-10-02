from app.services.summary_service import generate_summary


transcript = """
Hello this is a test of the Gnani audio notes platform.
This recording is being converted from speech to text.
The platform will generate a useful summary from the transcript.
"""


summary = generate_summary(transcript)

print("\n==============================")
print("SUMMARY")
print("==============================")
print(summary)
print("==============================\n")