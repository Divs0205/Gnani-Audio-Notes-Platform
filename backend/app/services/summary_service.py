import os

from dotenv import load_dotenv
from google import genai


load_dotenv()


class SummaryAPIError(Exception):
    """Raised when summary generation fails."""
    pass


def generate_summary(transcript: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise SummaryAPIError("GEMINI_API_KEY is not configured")

    if not transcript or not transcript.strip():
        raise SummaryAPIError("Transcript is empty")

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an assistant that creates clear notes from audio transcripts.

Summarize the following transcript.

Requirements:
- Give a short overview first.
- Extract the main points.
- Mention important details, facts, decisions, or action items if present.
- Do not invent information that is not present in the transcript.
- Keep the summary easy to read.
- Use bullet points where appropriate.

Transcript:
{transcript}
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )

        summary = response.text

        if not summary:
            raise SummaryAPIError("Gemini returned an empty summary")

        return summary.strip()

    except SummaryAPIError:
        raise
    except Exception as e:
        raise SummaryAPIError(f"Summary generation failed: {str(e)}")