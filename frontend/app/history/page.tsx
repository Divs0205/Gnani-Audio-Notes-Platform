"use client";

import {
  useEffect,
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

export default function HistoryPage() {
  const [notes, setNotes] =
    useState<AudioNote[]>([]);

  const [selectedNote, setSelectedNote] =
    useState<AudioNote | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [selectedLoading, setSelectedLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/audio`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load your recordings."
        );
      }

      const data = await response.json();

      setNotes(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load history."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openRecording(id: number) {
    setSelectedLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/audio/${id}`
      );

      if (!response.ok) {
        throw new Error(
          "Could not open this recording."
        );
      }

      const data = await response.json();

      setSelectedNote(data);

      setTimeout(() => {
        document
          .getElementById(
            "selected-recording"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 50);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not open recording."
      );
    } finally {
      setSelectedLoading(false);
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
              href="/"
              className="text-[#766f66] transition hover:text-[#a9563d]"
            >
              New recording
            </Link>

            <Link
              href="/architecture"
              className="text-[#766f66] transition hover:text-[#a9563d]"
            >
              How it works
            </Link>

          </nav>

        </header>


        {/* Intro */}

        <section className="pb-12 pt-20">

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a9563d]">
            Your archive
          </p>

          <h1 className="mt-4 text-5xl font-bold tracking-[-0.03em]">
            History
          </h1>

          <p className="mt-4 max-w-xl text-base leading-8 text-[#766f66]">
            Previous recordings stay here so you can
            return to the transcript and notes whenever
            you need them.
          </p>

        </section>


        {/* Archive */}

        <section>

          <div className="border-y border-[#e2dbcf] bg-[#fffdf9]/60">

            {loading && (
              <div className="py-14 text-center text-sm text-[#999187]">
                Loading recordings...
              </div>
            )}


            {!loading &&
              notes.length === 0 && (
                <div className="py-16 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1ede4] text-[#766f66]">
                    <MusicIcon />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold">
                    Nothing here yet
                  </h2>

                  <p className="mt-2 text-sm text-[#999187]">
                    Upload a recording to start your archive.
                  </p>

                  <Link
                    href="/"
                    className="mt-6 inline-flex bg-[#c96b4b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a9563d]"
                  >
                    Add recording
                  </Link>

                </div>
              )}


            {!loading &&
              notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() =>
                    openRecording(note.id)
                  }
                  className={`archive-row flex w-full items-center justify-between border-b border-l-2 border-[#e2dbcf] px-4 py-6 text-left last:border-b-0 sm:px-6 ${
                    selectedNote?.id === note.id
                      ? "archive-row-selected"
                      : "border-l-transparent"
                  }`}
                >

                  <div className="flex min-w-0 items-center gap-5">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f1ede4] text-[#766f66]">
                      <MusicIcon />
                    </div>

                    <div className="min-w-0">

                      <h2 className="truncate font-semibold text-[#3a3733]">
                        {note.filename}
                      </h2>

                      <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-[#999187]">

                        <span>
                          {formatDuration(
                            note.duration_seconds
                          )}
                        </span>

                        <span>
                          {formatDate(
                            note.created_at
                          )}
                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="ml-4 flex shrink-0 items-center gap-5">

                    <StatusText
                      status={note.status}
                    />

                    <span className="text-xl text-[#b9b0a5] transition group-hover:text-[#c96b4b]">
                      →
                    </span>

                  </div>

                </button>
              ))}

          </div>

        </section>


        {/* Error */}

        {error && (
          <div className="mt-6 border-l-2 border-[#a94e43] bg-[#f9ece9] px-4 py-3 text-sm leading-6 text-[#7f3d35]">
            {error}
          </div>
        )}


        {/* Loading selected recording */}

        {selectedLoading && (
          <section className="mt-10 border-y border-[#e2dbcf] py-12 text-center">

            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#e2dbcf] border-t-[#c96b4b]" />

            <p className="mt-4 text-sm text-[#999187]">
              Opening recording...
            </p>

          </section>
        )}


        {/* Selected result — directly below archive */}

        {selectedNote &&
          !selectedLoading && (
            <section
              id="selected-recording"
              className="scroll-mt-8 pb-20 pt-12"
            >

              <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#e2dbcf] pb-6">

                <div>

                  <p className="text-xs uppercase tracking-[0.16em] text-[#999187]">
                    Selected recording
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {selectedNote.filename}
                  </h2>

                </div>

                <StatusText
                  status={selectedNote.status}
                />

              </div>


              {selectedNote.status ===
                "FAILED" && (
                <div className="border-l-2 border-[#a94e43] bg-[#f9ece9] px-5 py-5">

                  <p className="font-semibold text-[#7f3d35]">
                    Something went wrong
                  </p>

                  <p className="mt-1 text-sm leading-7 text-[#7f3d35]">
                    {selectedNote.error_message ||
                      "This recording could not be processed."}
                  </p>

                </div>
              )}


              {selectedNote.status ===
                "COMPLETED" && (
                <div className="grid gap-12 lg:grid-cols-2">

                  {/* Summary */}

                  <article>

                    <div className="mb-5 flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8e9e2] text-[#c96b4b]">
                        <SparkIcon />
                      </div>

                      <p className="text-xs uppercase tracking-[0.14em] text-[#999187]">
                        Summary
                      </p>

                    </div>

                    <div className="border-t border-[#e2dbcf] pt-6">

                      <RenderSummary
                        text={
                          selectedNote.summary ||
                          "No summary was generated."
                        }
                      />

                    </div>

                  </article>


                  {/* Transcript */}

                  <article>

                    <div className="mb-5 flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1ede4] text-[#766f66]">
                        <TranscriptIcon />
                      </div>

                      <p className="text-xs uppercase tracking-[0.14em] text-[#999187]">
                        Transcript
                      </p>

                    </div>

                    <div className="max-h-[520px] overflow-y-auto border-t border-[#e2dbcf] pt-6 text-sm leading-8 text-[#766f66]">
                      {selectedNote.transcript ||
                        "No transcript was generated."}
                    </div>

                  </article>

                </div>
              )}


              {selectedNote.status !==
                "COMPLETED" &&
                selectedNote.status !==
                  "FAILED" && (
                  <ProcessingState
                    status={
                      selectedNote.status
                    }
                  />
                )}

            </section>
          )}

        <footer className="border-t border-[#e2dbcf] py-8 text-center text-xs text-[#999187]">
          Audio Notes · your recordings, kept useful
        </footer>

      </div>

    </main>
  );
}


/* ================================================== */
/* Summary renderer                                   */
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
              className="text-lg font-semibold text-[#3a3733]"
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
/* Processing                                         */
/* ================================================== */

function ProcessingState({
  status,
}: {
  status: string;
}) {
  const stages = [
    {
      name: "Upload received",
      done: true,
      active: false,
    },
    {
      name: "Transcribing audio",
      done:
        status === "SUMMARIZING",
      active:
        status === "TRANSCRIBING",
    },
    {
      name: "Writing summary",
      done: false,
      active:
        status === "SUMMARIZING",
    },
  ];

  return (
    <div className="border-y border-[#e2dbcf] py-8">

      <p className="text-xs uppercase tracking-[0.16em] text-[#999187]">
        Processing
      </p>

      <div className="mt-5 divide-y divide-[#ebe5db]">

        {stages.map((stage) => (
          <div
            key={stage.name}
            className="flex items-center gap-4 py-4"
          >

            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                stage.done
                  ? "bg-[#edf3ed] text-[#66856b]"
                  : stage.active
                    ? "bg-[#f8e9e2] text-[#c96b4b]"
                    : "bg-[#f1ede4] text-[#999187]"
              }`}
            >
              {stage.done ? "✓" : "•"}
            </span>

            <span
              className={
                stage.active
                  ? "font-semibold text-[#3a3733]"
                  : "text-[#766f66]"
              }
            >
              {stage.name}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}


/* ================================================== */
/* Status                                             */
/* ================================================== */

function StatusText({
  status,
}: {
  status: string;
}) {
  const color =
    status === "COMPLETED"
      ? "text-[#66856b]"
      : status === "FAILED"
        ? "text-[#a94e43]"
        : "text-[#c96b4b]";

  return (
    <span
      className={`text-xs font-semibold uppercase tracking-[0.08em] ${color}`}
    >
      {status}
    </span>
  );
}


/* ================================================== */
/* Helpers                                            */
/* ================================================== */

function formatDuration(
  seconds: number | null
) {
  if (
    seconds === null ||
    seconds === undefined
  ) {
    return "Duration unavailable";
  }

  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconds`;
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(
    seconds % 60
  );

  return `${minutes}m ${remaining}s`;
}

function formatDate(date?: string) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
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

function MusicIcon() {
  return (
    <IconWrapper>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
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