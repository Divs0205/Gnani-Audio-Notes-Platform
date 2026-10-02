"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type AudioNote = {
  id: number;
  filename: string;
  status: string;
  file_size: number | null;
  duration_seconds: number | null;
  transcript?: string | null;
  summary?: string | null;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function HomePage() {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [currentJob, setCurrentJob] =
    useState<AudioNote | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedId =
      sessionStorage.getItem(
        "audioNotesCurrentId"
      );

    if (!savedId) return;

    fetch(`${API_BASE}/api/audio/${savedId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data) => {
        setCurrentJob(data);
      })
      .catch(() => {
        sessionStorage.removeItem(
          "audioNotesCurrentId"
        );
      });
  }, []);

  useEffect(() => {
    if (!currentJob) return;

    if (
      currentJob.status === "COMPLETED" ||
      currentJob.status === "FAILED"
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/audio/${currentJob.id}`
        );

        if (!response.ok) return;

        const data = await response.json();

        setCurrentJob(data);

        if (
          data.status === "COMPLETED" ||
          data.status === "FAILED"
        ) {
          clearInterval(interval);
        }
      } catch {
        // Continue polling.
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentJob]);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setUploadError("");
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function uploadAudio() {
    if (!selectedFile) return;

    setLoading(true);
    setUploadError("");
    setCurrentJob(null);

    const formData = new FormData();

    formData.append(
      "file",
      selectedFile
    );

    try {
      const response = await fetch(
        `${API_BASE}/api/audio/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Upload failed."
        );
      }

      setCurrentJob(data);

      sessionStorage.setItem(
        "audioNotesCurrentId",
        String(data.id)
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-transparent text-[#292725]">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}

        <header className="flex items-center justify-between border-b border-[#e2dbcf]/80 py-5">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c96b4b] text-white">
              <WaveformIcon />
            </div>

            <span className="font-semibold tracking-tight">
              Audio Notes
            </span>
          </Link>

          <nav className="flex items-center gap-5 text-sm">

            <Link
              href="/history"
              className="text-[#766f66] transition hover:text-[#a9563d]"
            >
              History
            </Link>

            <Link
              href="/architecture"
              className="text-[#766f66] transition hover:text-[#a9563d]"
            >
              How it works
            </Link>

          </nav>

        </header>


        {/* Main introduction */}

        <section className="grid gap-12 pb-16 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pt-28">

          <div>

            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a9563d]">
              A quieter way to keep track of what you hear
            </p>

            <h1 className="mt-5 max-w-2xl text-5xl font-bold leading-[1.04] tracking-[-0.035em] text-[#292725] sm:text-6xl">
              Give your recordings
              <span className="block text-[#a9563d]">
                somewhere useful to go.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[#766f66]">
              Upload a lecture, thought, conversation,
              or voice memo. Audio Notes turns the recording
              into a transcript and a short set of notes you
              can return to later.
            </p>

          </div>


          <div className="lg:pb-2 lg:pl-12">

            <div className="border-l border-[#d8cfc2] pl-6">

              <p className="text-sm leading-7 text-[#766f66]">
                Nothing complicated to organise.
                Upload the recording and let the
                processing happen in the background.
              </p>

              <div className="mt-5 flex items-center gap-3 text-xs text-[#999187]">
                <span className="h-2 w-2 rounded-full bg-[#66856b]" />
                Transcription and summaries are saved
                with each recording.
              </div>

            </div>

          </div>

        </section>


        {/* Upload area */}

        <section className="pb-16">

          <div className="border-y border-[#e2dbcf] bg-[#fffdf9]/70 px-1 py-10 sm:px-8">

            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">

              <div>

                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#999187]">
                  New recording
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Add an audio file
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-7 text-[#766f66]">
                  Choose a recording from your device.
                  Short and long recordings are handled
                  through the appropriate transcription path.
                </p>

              </div>


              <div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.m4a,.mp4,.webm,.ogg,.flac,audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={openFilePicker}
                  className="inline-flex items-center gap-3 border border-[#d8d0c3] bg-[#fffcf7] px-5 py-3 text-sm font-semibold text-[#3a3733] transition hover:border-[#c96b4b] hover:text-[#a9563d]"
                >
                  <UploadIcon />
                  Choose audio
                </button>

              </div>

            </div>


            {selectedFile && (
              <div className="mt-8 flex flex-col gap-4 border-t border-[#ebe5db] pt-6 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">

                  <p className="truncate text-sm font-semibold text-[#3a3733]">
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-xs text-[#999187]">
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </p>

                </div>

                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="border border-[#d8d0c3] px-4 py-2.5 text-sm text-[#766f66] transition hover:border-[#c96b4b]"
                  >
                    Change
                  </button>

                  <button
                    type="button"
                    onClick={uploadAudio}
                    disabled={loading}
                    className="bg-[#c96b4b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a9563d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Uploading..."
                      : "Upload recording"}
                  </button>

                </div>

              </div>
            )}


            {uploadError && (
              <div className="mt-6 border-l-2 border-[#a94e43] bg-[#f9ece9] px-4 py-3 text-sm leading-6 text-[#7f3d35]">
                {uploadError}
              </div>
            )}

          </div>

        </section>


        {/* Processing */}

        {currentJob &&
          currentJob.status !== "COMPLETED" &&
          currentJob.status !== "FAILED" && (
            <section className="border-y border-[#e2dbcf] py-10">

              <ProcessingState
                status={currentJob.status}
              />

            </section>
          )}


        {/* Failure */}

        {currentJob?.status === "FAILED" && (
          <section className="border-y border-[#e5b7b0] bg-[#f9ece9] py-8">

            <div className="flex gap-4">

              <div className="mt-1 text-[#a94e43]">
                <AlertIcon />
              </div>

              <div>

                <p className="font-semibold text-[#7f3d35]">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm leading-7 text-[#7f3d35]">
                  {currentJob.error_message ||
                    "The recording could not be processed."}
                </p>

              </div>

            </div>

          </section>
        )}


        {/* Results */}

        {currentJob?.status === "COMPLETED" && (
          <section className="pb-20 pt-12">

            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">

              <div>

                <p className="text-xs uppercase tracking-[0.16em] text-[#999187]">
                  Finished recording
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {currentJob.filename}
                </h2>

              </div>

              <span className="text-sm text-[#66856b]">
                Completed
              </span>

            </div>

            <ResultSection job={currentJob} />

          </section>
        )}


        {/* Footer */}

        <footer className="border-t border-[#e2dbcf] py-8 text-center text-xs text-[#999187]">
          Audio Notes · a simple place for recordings and notes
        </footer>

      </div>
    </main>
  );
}


/* ================================================== */
/* Result                                             */
/* ================================================== */

function ResultSection({
  job,
}: {
  job: AudioNote;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-2">

      <article>

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8e9e2] text-[#c96b4b]">
            <SparkIcon />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#999187]">
              Summary
            </p>
          </div>

        </div>

        <div className="border-t border-[#e2dbcf] pt-6">
          <RenderSummary
            text={
              job.summary ||
              "No summary was generated."
            }
          />
        </div>

      </article>


      <article>

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1ede4] text-[#766f66]">
            <TranscriptIcon />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#999187]">
              Transcript
            </p>
          </div>

        </div>

        <div className="max-h-[520px] overflow-y-auto border-t border-[#e2dbcf] pt-6 text-sm leading-8 text-[#766f66]">
          {job.transcript ||
            "No transcript was generated."}
        </div>

      </article>

    </div>
  );
}


/* ================================================== */
/* Summary                                            */
/* ================================================== */

function RenderSummary({
  text,
}: {
  text: string;
}) {
  const lines = text.split("\n");

  function renderInlineFormatting(
    content: string
  ) {
    const parts = content.split(
      /(\*\*.*?\*\*)/g
    );

    return parts.map((part, index) => {

      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong
            key={index}
            className="font-semibold text-[#3a3733]"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      return (
        <span key={index}>
          {part}
        </span>
      );
    });
  }

  return (
    <div className="space-y-5 text-sm leading-7 text-[#4f4a43]">

      {lines.map((line, index) => {

        const trimmed = line.trim();

        if (!trimmed) return null;

        const heading =
          trimmed.match(
            /^\*\*(.+?)\*\*$/
          );

        if (heading) {
          return (
            <h3
              key={index}
              className="pt-1 text-lg font-semibold text-[#3a3733]"
            >
              {heading[1]}
            </h3>
          );
        }

        if (
          trimmed.startsWith("* ") ||
          trimmed.startsWith("- ")
        ) {
          return (
            <div
              key={index}
              className="flex gap-3"
            >
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c96b4b]" />

              <p>
                {renderInlineFormatting(
                  trimmed.substring(2)
                )}
              </p>

            </div>
          );
        }

        return (
          <p key={index}>
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}

    </div>
  );
}


/* ================================================== */
/* Processing state                                   */
/* ================================================== */

function ProcessingState({
  status,
}: {
  status: string;
}) {
  const stages = [
    {
      name: "Upload received",
      active: true,
      complete: true,
    },
    {
      name: "Transcribing audio",
      active:
        status === "TRANSCRIBING" ||
        status === "SUMMARIZING",
      complete:
        status === "SUMMARIZING",
    },
    {
      name: "Writing summary",
      active:
        status === "SUMMARIZING",
      complete: false,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">

      <p className="text-xs uppercase tracking-[0.16em] text-[#999187]">
        Processing recording
      </p>

      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        We’re working through your audio.
      </h2>

      <div className="mt-8 divide-y divide-[#ebe5db] border-y border-[#e2dbcf]">

        {stages.map((stage) => (
          <div
            key={stage.name}
            className="flex items-center gap-4 py-4"
          >

            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                stage.complete
                  ? "bg-[#edf3ed] text-[#66856b]"
                  : stage.active
                    ? "border border-[#e1b8a8] bg-[#f8e9e2] text-[#c96b4b]"
                    : "bg-[#f1ede4] text-[#999187]"
              }`}
            >
              {stage.complete ? "✓" : "•"}
            </span>

            <span
              className={
                stage.active
                  ? "text-sm font-semibold text-[#3a3733]"
                  : "text-sm text-[#999187]"
              }
            >
              {stage.name}
            </span>

          </div>
        ))}

      </div>

      <p className="mt-5 text-xs text-[#999187]">
        Current status: {status}
      </p>

    </div>
  );
}


/* ================================================== */
/* Helpers                                            */
/* ================================================== */

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


/* ================================================== */
/* Icons                                              */
/* ================================================== */

function IconWrapper({
  children,
  size = 19,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function WaveformIcon() {
  return (
    <IconWrapper>
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 4v16" />
      <path d="M16 7v10" />
      <path d="M20 10v4" />
    </IconWrapper>
  );
}

function UploadIcon() {
  return (
    <IconWrapper>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 15v4h14v-4" />
    </IconWrapper>
  );
}

function SparkIcon() {
  return (
    <IconWrapper>
      <path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" />
    </IconWrapper>
  );
}

function TranscriptIcon() {
  return (
    <IconWrapper>
      <path d="M8 5h8" />
      <path d="M12 5v14" />
      <path d="M8 19h8" />
    </IconWrapper>
  );
}

function AlertIcon() {
  return (
    <IconWrapper>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </IconWrapper>
  );
}