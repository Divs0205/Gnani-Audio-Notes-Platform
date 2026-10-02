import os
from pathlib import Path

import requests
from dotenv import load_dotenv


load_dotenv()


GNANI_API_URL = "https://api.vachana.ai/stt/v3"


class GnaniAPIError(Exception):
    """Raised when Gnani transcription fails."""
    pass


def transcribe_audio(
    file_path: str,
    language_code: str = "en-IN",
) -> str:

    api_key = os.getenv("GNANI_API_KEY")

    if not api_key:
        raise GnaniAPIError(
            "GNANI_API_KEY is not configured"
        )

    path = Path(file_path)

    if not path.exists():
        raise GnaniAPIError(
            f"Audio file not found: {file_path}"
        )

    try:
        with path.open("rb") as audio_file:

            files = {
                "audio_file": (
                    path.name,
                    audio_file,
                )
            }

            data = {
                "language_code": language_code,
                "format": "transcribe",
            }

            headers = {
                "X-API-Key-ID": api_key
            }

            response = requests.post(
                GNANI_API_URL,
                headers=headers,
                files=files,
                data=data,
                timeout=120,
            )

        if response.status_code != 200:
            raise GnaniAPIError(
                f"Gnani API returned "
                f"{response.status_code}: "
                f"{response.text}"
            )

        result = response.json()

        if not result.get("success"):
            error = result.get(
                "error",
                {}
            )

            raise GnaniAPIError(
                error.get(
                    "message",
                    "Gnani transcription failed"
                )
            )

        transcript = result.get("transcript")

        if not transcript:
            raise GnaniAPIError(
                "Gnani returned an empty transcript"
            )

        return transcript

    except requests.Timeout:
        raise GnaniAPIError(
            "Gnani API request timed out"
        )

    except requests.RequestException as e:
        raise GnaniAPIError(
            f"Could not connect to Gnani: {str(e)}"
        )