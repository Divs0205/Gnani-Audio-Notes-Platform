import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "audio-files")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is not set")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY is not set")


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
)


def upload_audio_file(
    local_file_path: str,
    storage_path: str,
) -> str:
    """
    Upload an audio file from local storage to Supabase Storage.

    Returns the path of the uploaded file inside the bucket.
    """

    file_path = Path(local_file_path)

    if not file_path.exists():
        raise FileNotFoundError(
            f"Audio file not found: {local_file_path}"
        )

    with open(file_path, "rb") as audio_file:
        supabase.storage.from_(SUPABASE_BUCKET).upload(
            storage_path,
            audio_file,
            {
                "upsert": "true",
            },
        )

    return storage_path

def download_audio_file(
    storage_path: str,
    local_file_path: str,
) -> str:
    """
    Download an audio file from Supabase Storage
    to a temporary local path.

    Returns the local file path.
    """

    data = supabase.storage.from_(SUPABASE_BUCKET).download(
        storage_path
    )

    output_path = Path(local_file_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "wb") as audio_file:
        audio_file.write(data)

    return str(output_path)