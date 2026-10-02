import json
import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv


load_dotenv()


GNANI_BASE_URL = "https://api.vachana.ai"
BATCH_JOBS_URL = f"{GNANI_BASE_URL}/stt/v3/batch/jobs"


class GnaniBatchAPIError(Exception):
    """Raised when Gnani Batch transcription fails."""
    pass


def create_batch_job(
    file_path: str,
    language_code: str = "en-IN",
    max_retries: int = 5,
) -> str:
    """
    Create a Gnani Batch job and upload one audio file.

    Retries temporary 429 rate-limit responses using
    exponential backoff.

    Returns:
        Gnani job ID
    """

    api_key = os.getenv("GNANI_API_KEY")

    if not api_key:
        raise GnaniBatchAPIError(
            "GNANI_API_KEY is not configured"
        )

    headers = {
        "X-API-Key-ID": api_key,
    }

    path = Path(file_path)

    if not path.exists():
        raise GnaniBatchAPIError(
            f"Audio file not found: {file_path}"
        )

    config = {
        "model": "gnani-prisma-v2.5",
        "language_code": language_code,
        "mode": "transcribe",
        "with_diarization": False,
        "is_multi_channel": False,
    }

    headers = {
        "X-API-Key-ID": api_key
    }

    for attempt in range(max_retries):

        try:
            with path.open("rb") as audio_file:

                files = {
                    "config": (
                        None,
                        json.dumps(config),
                        "application/json",
                    ),
                    "files": (
                        path.name,
                        audio_file,
                    ),
                }

                response = requests.post(
                    BATCH_JOBS_URL,
                    headers=headers,
                    files=files,
                    timeout=120,
                )

            if response.status_code == 201:

                result = response.json()

                job_id = result.get("job_id")

                if not job_id:
                    raise GnaniBatchAPIError(
                        "Gnani Batch response did not "
                        "contain job_id"
                    )

                return job_id

            if response.status_code == 429:

                retry_after = response.headers.get(
                    "Retry-After"
                )

                if retry_after:
                    try:
                        wait_seconds = int(retry_after)
                    except ValueError:
                        wait_seconds = 30
                else:
                    wait_seconds = 30 * (2 ** attempt)

                if attempt == max_retries - 1:
                    raise GnaniBatchAPIError(
                        f"Batch create failed after "
                        f"{max_retries} attempts: "
                        f"{response.text}"
                    )

                print(
                    f"Gnani Batch creation was "
                    f"rate-limited. "
                    f"Retrying in {wait_seconds} seconds..."
                )

                time.sleep(wait_seconds)
                continue

            raise GnaniBatchAPIError(
                f"Batch create failed "
                f"({response.status_code}): "
                f"{response.text}"
            )

        except requests.RequestException as e:

            if attempt == max_retries - 1:
                raise GnaniBatchAPIError(
                    f"Could not connect to Gnani Batch API: "
                    f"{str(e)}"
                )

            wait_seconds = 30 * (2 ** attempt)

            print(
                f"Network error while creating Batch job. "
                f"Retrying in {wait_seconds} seconds..."
            )

            time.sleep(wait_seconds)

    raise GnaniBatchAPIError(
        "Unable to create Gnani Batch job"
    )


def start_batch_job(
    job_id: str,
    max_retries: int = 5,
):
    """
    Start a previously created Gnani Batch job.

    If Gnani temporarily rate-limits the request,
    retry the same job with exponential backoff.
    """

    api_key = os.getenv("GNANI_API_KEY")

    if not api_key:
        raise GnaniBatchAPIError(
            "GNANI_API_KEY is not configured"
        )

    headers = {
        "X-API-Key-ID": api_key
    }

    url = f"{BATCH_JOBS_URL}/{job_id}/start"

    for attempt in range(max_retries):

        try:
            response = requests.post(
                url,
                headers=headers,
                timeout=60,
            )

            # Successful start
            if response.status_code == 202:
                print(
                    f"Gnani Batch job {job_id} "
                    "started successfully."
                )
                return response.json()

            # Rate limited
            if response.status_code == 429:

                retry_after = response.headers.get(
                    "Retry-After"
                )

                if retry_after:
                    try:
                        wait_seconds = int(retry_after)
                    except ValueError:
                        wait_seconds = 30
                else:
                    wait_seconds = 30 * (2 ** attempt)

                if attempt == max_retries - 1:
                    raise GnaniBatchAPIError(
                        f"Batch start failed after "
                        f"{max_retries} attempts: "
                        f"{response.text}"
                    )

                print(
                    f"Gnani rate limit reached. "
                    f"Retrying in {wait_seconds} seconds..."
                )

                time.sleep(wait_seconds)
                continue

            # Any other API error
            raise GnaniBatchAPIError(
                f"Batch start failed "
                f"({response.status_code}): "
                f"{response.text}"
            )

        except requests.RequestException as e:

            if attempt == max_retries - 1:
                raise GnaniBatchAPIError(
                    f"Could not start Gnani Batch job: "
                    f"{str(e)}"
                )

            wait_seconds = 30 * (2 ** attempt)

            print(
                f"Network error while starting Batch job. "
                f"Retrying in {wait_seconds} seconds..."
            )

            time.sleep(wait_seconds)

    raise GnaniBatchAPIError(
        "Unable to start Gnani Batch job"
    )


def wait_for_batch_completion(
    job_id: str,
    poll_interval: int = 10,
    max_wait_seconds: int = 4 * 60 * 60,
):
    """
    Poll Gnani until the Batch job reaches a terminal state.

    Handles temporary rate limiting using Retry-After
    or exponential backoff.
    """

    api_key = os.getenv("GNANI_API_KEY")

    if not api_key:
        raise GnaniBatchAPIError(
            "GNANI_API_KEY is not configured"
        )

    headers = {
        "X-API-Key-ID": api_key
    }

    url = f"{BATCH_JOBS_URL}/{job_id}"

    start_time = time.time()
    current_poll_interval = poll_interval

    terminal_statuses = {
        "COMPLETED",
        "PARTIAL_FAILURE",
        "FAILED",
        "START_FAILED",
        "CANCELLED",
    }

    while True:

        if time.time() - start_time > max_wait_seconds:
            raise GnaniBatchAPIError(
                "Gnani Batch job timed out"
            )

        try:
            response = requests.get(
                url,
                headers=headers,
                timeout=60,
            )

            # Normal successful status response
            if response.status_code == 200:

                result = response.json()

                status = result.get("status")

                print(
                    f"Gnani Batch job {job_id} "
                    f"status: {status}"
                )

                if status in terminal_statuses:

                    if status != "COMPLETED":
                        raise GnaniBatchAPIError(
                            f"Gnani Batch job ended with "
                            f"status: {status}"
                        )

                    return result

                # Successful poll means we can go back
                # to our normal polling interval.
                current_poll_interval = poll_interval

                time.sleep(poll_interval)
                continue

            # Temporary rate limit
            if response.status_code == 429:

                retry_after = response.headers.get(
                    "Retry-After"
                )

                if retry_after:
                    try:
                        server_wait = int(retry_after)
                    except ValueError:
                        server_wait = 30
                else:
                    server_wait = 30

                # Never retry faster than our exponential backoff.
                wait_seconds = max(
                    server_wait,
                    current_poll_interval,
                )

                wait_seconds = min(
                    wait_seconds,
                    120,
                )

                print(
                    f"Gnani status check was rate-limited. "
                    f"Retrying in {wait_seconds} seconds..."
                )

                time.sleep(wait_seconds)

                # Increase the interval if rate limiting
                # continues.
                current_poll_interval = min(
                    current_poll_interval * 2,
                    120,
                )

                continue

            # Other API errors
            raise GnaniBatchAPIError(
                f"Batch status check failed "
                f"({response.status_code}): "
                f"{response.text}"
            )

        except requests.RequestException as e:

            print(
                f"Network error while checking "
                f"Batch status: {e}"
            )

            time.sleep(current_poll_interval)

            current_poll_interval = min(
                current_poll_interval * 2,
                120,
            )


def get_batch_transcript(job_id: str):
    """
    Retrieve the transcript from a completed Gnani Batch job.

    Gnani may temporarily rate-limit the files endpoint,
    so retry with exponential backoff when a 429 is returned.
    """

    # Get the API key directly inside this function.
    # This avoids relying on another global variable.
    load_dotenv()

    api_key = os.getenv("GNANI_API_KEY")

    if not api_key:
        raise GnaniBatchAPIError(
            "GNANI_API_KEY is not configured"
        )

    headers = {
        "X-API-Key-ID": api_key,
    }

    files_url = f"{BATCH_JOBS_URL}/{job_id}/files"

    max_attempts = 6

    for attempt in range(max_attempts):

        try:
            response = requests.get(
                files_url,
                headers=headers,
                timeout=120,
            )

        except requests.RequestException as e:

            if attempt == max_attempts - 1:
                raise GnaniBatchAPIError(
                    f"Could not get Batch files: {str(e)}"
                )

            wait_seconds = min(
                30 * (2 ** attempt),
                120,
            )

            print(
                f"Network error while getting Batch files. "
                f"Retrying in {wait_seconds} seconds..."
            )

            time.sleep(wait_seconds)
            continue

        # Gnani rate limit
        if response.status_code == 429:

            retry_after = response.headers.get(
                "Retry-After"
            )

            if retry_after:
                try:
                    wait_seconds = int(retry_after)
                except ValueError:
                    wait_seconds = 30
            else:
                wait_seconds = 30 * (2 ** attempt)

            wait_seconds = min(
                wait_seconds,
                120,
            )

            if attempt == max_attempts - 1:
                raise GnaniBatchAPIError(
                    f"Could not get Batch files for job "
                    f"{job_id} after {max_attempts} attempts "
                    f"because of rate limiting."
                )

            print(
                f"Gnani files request was rate-limited. "
                f"Retrying in {wait_seconds} seconds..."
            )

            time.sleep(wait_seconds)
            continue

        # Any other HTTP error
        if not response.ok:
            raise GnaniBatchAPIError(
                f"Could not get Batch files "
                f"({response.status_code}): "
                f"{response.text}"
            )

        data = response.json()

        files = data.get("data", [])

        if not files:
            raise GnaniBatchAPIError(
                f"Gnani Batch job {job_id} completed "
                f"but returned no files."
            )

        completed_file = None

        for file_info in files:

            if file_info.get("status") == "COMPLETED":
                completed_file = file_info
                break

        if completed_file is None:
            raise GnaniBatchAPIError(
                f"No completed transcript file found "
                f"for Batch job {job_id}."
            )

        transcript_url = completed_file.get(
            "transcript_url"
        )

        if not transcript_url:
            raise GnaniBatchAPIError(
                f"No transcript URL found for "
                f"Batch job {job_id}."
            )

        try:
            transcript_response = requests.get(
                transcript_url,
                timeout=120,
            )

        except requests.RequestException as e:
            raise GnaniBatchAPIError(
                f"Could not download transcript: {str(e)}"
            )

        if not transcript_response.ok:
            raise GnaniBatchAPIError(
                f"Could not download transcript "
                f"({transcript_response.status_code}): "
                f"{transcript_response.text}"
            )

        transcript_data = transcript_response.json()

        transcript = transcript_data.get(
            "full_transcript"
        )

        if not transcript:
            raise GnaniBatchAPIError(
                f"Transcript was empty for "
                f"Batch job {job_id}."
            )

        return transcript

    raise GnaniBatchAPIError(
        f"Could not get Batch files for job {job_id} "
        f"after {max_attempts} attempts because of "
        f"rate limiting."
    )


def transcribe_audio_batch(
    file_path: str,
    language_code: str = "en-IN",
) -> tuple[str, str]:
    """
    Complete Batch transcription workflow.

    Returns:
        (transcript, job_id)
    """

    print("Creating Gnani Batch job...")

    job_id = create_batch_job(
        file_path=file_path,
        language_code=language_code,
    )

    print(f"Gnani Batch job created: {job_id}")

    print("Starting Gnani Batch job...")

    start_batch_job(job_id)

    print("Waiting for Gnani Batch job...")

    wait_for_batch_completion(job_id)

    print("Gnani Batch job completed.")

    transcript = get_batch_transcript(job_id)

    return transcript, job_id