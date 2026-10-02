import Link from "next/link";
import type { ReactNode } from "react";

export default function ArchitecturePage() {
  return (
    <main className="architecture-page min-h-screen text-[#292725]">
      <div className="mx-auto max-w-6xl px-6">

        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <header className="flex items-center justify-between border-b border-[#ded6ca]/80 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c96b4b] text-white shadow-sm">
              <WaveformIcon />
            </div>

            <span className="font-semibold tracking-tight">
              Audio Notes
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/history"
              className="text-[#766f66] transition-colors hover:text-[#a9563d]"
            >
              History
            </Link>

            <Link
              href="/"
              className="text-[#766f66] transition-colors hover:text-[#a9563d]"
            >
              New recording
            </Link>
          </nav>
        </header>


        {/* ===================================================== */}
        {/* HERO */}
        {/* ===================================================== */}

        <section className="architecture-hero border-b border-[#ded6ca] py-20 sm:py-24">

          <div className="max-w-4xl">

            <SectionLabel
              number="00"
              text="System overview"
            />

            <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-[1.03] tracking-[-0.04em] sm:text-6xl">
              From a recording
              <span className="block text-[#a9563d]">
                to something worth keeping.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-[#5f5951]">
              Audio Notes separates storage, transcription,
              background processing and summarisation into
              small pieces that can work independently.
            </p>

          </div>

        </section>


        {/* ===================================================== */}
        {/* 01 — SYSTEM MAP */}
        {/* ===================================================== */}

        <section className="architecture-section py-16">

          <SectionHeading
            number="01"
            eyebrow="System map"
            title="One recording, several small steps."
            description="The browser starts the process. The backend owns the work."
          />

          <div className="readable-panel mt-10">

            <div className="panel-header">

              <span>
                Audio Notes / processing pipeline
              </span>

              <span className="flex items-center gap-2 text-[#66856b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#66856b]" />
                asynchronous
              </span>

            </div>

            <div className="p-6 sm:p-9">

              <ArchitectureNode
                number="01"
                title="Browser"
                subtitle="Upload"
                description="The user selects an audio recording."
                icon={<BrowserIcon />}
                accent="terracotta"
                wide
              />

              <Connector />

              <div className="grid gap-4 md:grid-cols-3">

                <ArchitectureNode
                  number="02"
                  title="FastAPI"
                  subtitle="API layer"
                  description="Validates the file and creates a queued recording."
                  icon={<ServerIcon />}
                  accent="neutral"
                />

                <ArchitectureNode
                  number="03"
                  title="Supabase"
                  subtitle="Object storage"
                  description="Keeps the original audio file."
                  icon={<CloudIcon />}
                  accent="neutral"
                />

                <ArchitectureNode
                  number="04"
                  title="PostgreSQL"
                  subtitle="Application state"
                  description="Stores metadata, transcript, summary and status."
                  icon={<DatabaseIcon />}
                  accent="neutral"
                />

              </div>

              <Connector />

              <ArchitectureNode
                number="05"
                title="Background worker"
                subtitle="Processing"
                description="Claims queued recordings and performs the longer-running work outside the upload request."
                icon={<WorkerIcon />}
                accent="sage"
                wide
              />

              <Connector />

              <div className="grid gap-4 md:grid-cols-2">

                <ArchitectureNode
                  number="06"
                  title="Gnani"
                  subtitle="Speech recognition"
                  description="Transcribes the audio using the REST or Batch API."
                  icon={<MicIcon />}
                  accent="terracotta"
                />

                <ArchitectureNode
                  number="07"
                  title="Gemini"
                  subtitle="Summarisation"
                  description="Turns the resulting transcript into concise notes."
                  icon={<SparkIcon />}
                  accent="sage"
                />

              </div>

              <Connector />

              <ArchitectureNode
                number="08"
                title="Saved recording"
                subtitle="Result"
                description="The completed transcript and summary are stored and shown in the application."
                icon={<DocumentIcon />}
                accent="neutral"
                wide
              />

            </div>
          </div>

        </section>


        {/* ===================================================== */}
        {/* 02 — PROCESSING LIFECYCLE */}
        {/* ===================================================== */}

        <section className="architecture-section py-16">

          <SectionHeading
            number="02"
            eyebrow="Processing lifecycle"
            title="The backend tells the story."
            description="Every recording moves through explicit states instead of relying on a browser-side timer."
          />

          <div className="readable-panel mt-10">

            <div className="grid md:grid-cols-4">

              <LifecycleStep
                number="01"
                status="QUEUED"
                title="Waiting"
                description="The upload is stored and waits for the worker."
                color="neutral"
              />

              <LifecycleStep
                number="02"
                status="TRANSCRIBING"
                title="Listening"
                description="Gnani converts the recording into text."
                color="terracotta"
              />

              <LifecycleStep
                number="03"
                status="SUMMARIZING"
                title="Condensing"
                description="Gemini turns the transcript into useful notes."
                color="terracotta"
              />

              <LifecycleStep
                number="04"
                status="COMPLETED"
                title="Ready"
                description="Transcript and summary are available to revisit."
                color="sage"
              />

            </div>

          </div>

        </section>


        {/* ===================================================== */}
        {/* 03 — TRANSCRIPTION STRATEGY */}
        {/* ===================================================== */}

        <section className="architecture-section py-16">

          <SectionHeading
            number="03"
            eyebrow="Transcription strategy"
            title="Short and long recordings take different routes."
            description="The application chooses the Gnani endpoint using the detected recording duration."
          />

          <div className="readable-panel mt-10">

            <div className="grid lg:grid-cols-2">

              {/* SHORT */}

              <div className="border-b border-[#ded6ca] p-7 lg:border-b-0 lg:border-r">

                <RouteHeader
                  number="01"
                  label="Short audio"
                  threshold="≤ 30 seconds"
                  icon={<LightningIcon />}
                  color="terracotta"
                />

                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">
                  Gnani REST
                </h3>

                <p className="mt-3 max-w-lg text-sm leading-7 text-[#514c46]">
                  The worker sends the recording directly to the
                  speech-to-text endpoint and receives the transcript
                  in the response.
                </p>

                <div className="mt-7 flex items-center gap-3 border-t border-[#e4ddd3] pt-5">

                  <span className="h-1.5 w-1.5 rounded-full bg-[#c96b4b]" />

                  <span className="text-xs text-[#766f66]">
                    Direct transcription request
                  </span>

                </div>

              </div>


              {/* LONG */}

              <div className="p-7">

                <RouteHeader
                  number="02"
                  label="Long audio"
                  threshold="&gt; 30 seconds"
                  icon={<LayersIcon />}
                  color="sage"
                />

                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">
                  Gnani Batch
                </h3>

                <p className="mt-3 max-w-lg text-sm leading-7 text-[#514c46]">
                  The worker creates a batch job, starts it, waits
                  for completion and retrieves the finished transcript.
                </p>

                <div className="mt-7 flex flex-wrap gap-2 border-t border-[#e4ddd3] pt-5">

                  <ProcessChip number="01" text="Create" />
                  <ProcessChip number="02" text="Start" />
                  <ProcessChip number="03" text="Poll" />
                  <ProcessChip number="04" text="Retrieve" />

                </div>

              </div>

            </div>

          </div>


          <InfoStrip>
            Long recordings should not depend on an open browser
            request. Batch processing lets the backend continue
            working while the user can leave the page.
          </InfoStrip>

        </section>


        {/* ===================================================== */}
        {/* 04 — DATA OWNERSHIP */}
        {/* ===================================================== */}

        <section className="architecture-section py-16">

          <SectionHeading
            number="04"
            eyebrow="Data ownership"
            title="Each piece of data has a clear home."
            description="Audio files and application state are intentionally separated."
          />

          <div className="readable-panel mt-10">

            <div className="grid md:grid-cols-3">

              <DataRow
                number="01"
                title="Audio"
                system="Supabase Storage"
                icon={<CloudIcon />}
                description="The original recording is stored as an object. The database keeps its storage path."
              />

              <DataRow
                number="02"
                title="State"
                system="PostgreSQL"
                icon={<DatabaseIcon />}
                description="The database tracks the recording, status, transcript and generated summary."
              />

              <DataRow
                number="03"
                title="Temporary files"
                system="Worker"
                icon={<FolderIcon />}
                description="Files downloaded for transcription are temporary and removed after processing."
              />

            </div>

          </div>

        </section>


        {/* ===================================================== */}
        {/* 05 — BACKGROUND PROCESSING */}
        {/* ===================================================== */}

        <section className="architecture-section py-16">

          <SectionHeading
            number="05"
            eyebrow="Background processing"
            title="Why not do everything inside the upload request?"
            description="Because transcription is the slow part."
          />

          <div className="readable-panel mt-10">

            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">

              <div className="border-b border-[#ded6ca] p-7 lg:border-b-0 lg:border-r lg:py-9">

                <div className="mb-5 flex items-center gap-3">

                  <span className="h-2 w-2 rounded-full bg-[#c96b4b]" />

                  <span className="text-xs uppercase tracking-[0.15em] text-[#888076]">
                    Why asynchronous?
                  </span>

                </div>

                <p className="text-sm leading-8 text-[#514c46]">
                  A normal upload request should finish quickly.
                  Speech recognition and summarisation can take much
                  longer, especially when recordings become large.
                </p>

                <p className="mt-5 text-sm leading-8 text-[#514c46]">
                  The application therefore stores a queued job,
                  returns control to the user and lets the worker
                  perform the expensive work separately.
                </p>

              </div>

              <div className="divide-y divide-[#ded6ca]">

                <ReasonRow
                  number="01"
                  title="Responsive uploads"
                  text="The API does not have to wait for transcription to finish."
                />

                <ReasonRow
                  number="02"
                  title="Long audio support"
                  text="Batch jobs can continue independently of the browser."
                />

                <ReasonRow
                  number="03"
                  title="Recoverable state"
                  text="Processing state lives in PostgreSQL instead of only in memory."
                />

                <ReasonRow
                  number="04"
                  title="Clear progress"
                  text="The frontend reads the real state from the backend."
                />

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================== */}
        {/* 06 — RELIABILITY */}
        {/* ===================================================== */}

        <section className="architecture-section py-16">

          <SectionHeading
            number="06"
            eyebrow="Reliability"
            title="Failures stay visible."
            description="The system records what happened instead of silently losing a recording."
          />

          <div className="readable-panel mt-10">

            <div className="grid md:grid-cols-3">

              <ReliabilityRow
                number="01"
                icon={<RefreshIcon />}
                title="Rate limits"
                text="Gnani 429 responses are retried using server-provided or exponential backoff delays."
              />

              <ReliabilityRow
                number="02"
                icon={<AlertIcon />}
                title="Failed jobs"
                text="Errors are stored against the recording and surfaced in the interface."
              />

              <ReliabilityRow
                number="03"
                icon={<TrashIcon />}
                title="Cleanup"
                text="Temporary worker files are removed once processing has finished."
              />

            </div>

          </div>

        </section>


        {/* ===================================================== */}
        {/* 07 — TECHNOLOGY */}
        {/* ===================================================== */}

        <section className="architecture-section py-16">

          <SectionHeading
            number="07"
            eyebrow="Technology"
            title="The tools behind the system."
            description="Each technology has one clear responsibility."
          />

          <div className="readable-panel mt-10">

            <div className="divide-y divide-[#ded6ca]">

              <TechnologyRow
                number="01"
                name="Next.js"
                role="Frontend"
                description="Upload interface, history and result views."
                icon={<BrowserIcon />}
              />

              <TechnologyRow
                number="02"
                name="FastAPI"
                role="HTTP API"
                description="Handles uploads, jobs and recording data."
                icon={<ServerIcon />}
              />

              <TechnologyRow
                number="03"
                name="PostgreSQL"
                role="Application state"
                description="Stores persistent processing state and generated results."
                icon={<DatabaseIcon />}
              />

              <TechnologyRow
                number="04"
                name="Supabase"
                role="Object storage"
                description="Stores the original audio recordings."
                icon={<CloudIcon />}
              />

              <TechnologyRow
                number="05"
                name="Gnani"
                role="Speech recognition"
                description="Produces transcripts from short and long recordings."
                icon={<MicIcon />}
              />

              <TechnologyRow
                number="06"
                name="Gemini"
                role="Summarisation"
                description="Turns transcripts into concise, useful notes."
                icon={<SparkIcon />}
              />

              <TechnologyRow
                number="07"
                name="Python worker"
                role="Background processing"
                description="Coordinates transcription, summarisation and state updates."
                icon={<WorkerIcon />}
              />

            </div>

          </div>

        </section>


        {/* ===================================================== */}
        {/* 08 — NEXT STEPS */}
        {/* ===================================================== */}

        <section className="architecture-section py-16">

          <SectionHeading
            number="08"
            eyebrow="Next steps"
            title="Where this could go next."
            description="The current architecture keeps the core pieces simple enough to extend."
          />

          <div className="readable-panel mt-10">

            <div className="grid md:grid-cols-2">

              <FutureItem
                number="01"
                title="Managed queue"
                text="Move from the PostgreSQL-backed worker to Redis, Celery or another dedicated queue as traffic increases."
              />

              <FutureItem
                number="02"
                title="Authentication"
                text="Associate recordings with users and protect private audio and generated notes."
              />

              <FutureItem
                number="03"
                title="Realtime updates"
                text="Replace polling with WebSockets or Server-Sent Events for live job updates."
              />

              <FutureItem
                number="04"
                title="Observability"
                text="Add structured logs, metrics and production error monitoring."
              />

            </div>

          </div>

        </section>


        {/* ===================================================== */}
        {/* REPOSITORY                                              */}
        {/* ===================================================== */}

        <section className="architecture-section py-16">

          <div className="readable-panel overflow-hidden">

            <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">

              <div>

                <SectionLabel
                  number="SOURCE"
                  text="Project repository"
                />

                <h2 className="mt-5 text-3xl font-bold tracking-[-0.025em]">
                  The project behind Audio Notes.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-[#514c46]">
                  The repository contains the frontend, backend,
                  database migrations, services and background
                  worker used by the application.
                </p>

              </div>

              <a
                href="https://github.com/Divs0205/Gnani-Audio-Notes-Platform"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-between gap-8 border border-[#cfc5b7] bg-[#fffdf9] px-6 py-4 text-sm font-semibold transition-all hover:border-[#c96b4b] hover:text-[#a9563d]"
              >
                <span>
                  View repository
                </span>

                <span className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                  <ArrowUpRightIcon />
                </span>
              </a>

            </div>

          </div>


        </section>


        {/* ===================================================== */}
        {/* FOOTER */}
        {/* ===================================================== */}

        <footer className="border-t border-[#ded6ca] py-8 text-center text-xs text-[#999187]">
          Audio Notes · architecture and implementation
        </footer>

      </div>
    </main>
  );
}


/* ============================================================= */
/* SECTION LABEL                                                   */
/* ============================================================= */

function SectionLabel({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <span className="font-mono text-xs font-medium text-[#a9563d]">
        {number}
      </span>

      <span className="h-px w-8 bg-[#d8d0c3]" />

      <span className="text-xs uppercase tracking-[0.16em] text-[#888076]">
        {text}
      </span>

    </div>
  );
}


/* ============================================================= */
/* SECTION HEADING                                                 */
/* ============================================================= */

function SectionHeading({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">

      <SectionLabel
        number={number}
        text={eyebrow}
      />

      <h2 className="mt-5 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f5951]">
        {description}
      </p>

    </div>
  );
}


/* ============================================================= */
/* READABLE ARCHITECTURE NODE                                     */
/* ============================================================= */

function ArchitectureNode({
  number,
  title,
  subtitle,
  description,
  icon,
  accent,
  wide = false,
}: {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: ReactNode;
  accent: "terracotta" | "sage" | "neutral";
  wide?: boolean;
}) {
  const accentClasses = {
    terracotta: "border-[#d9a18e] bg-[#fdf5f1]",
    sage: "border-[#b8cbb9] bg-[#f5f8f4]",
    neutral: "border-[#dcd4c8] bg-[#fffdf9]",
  };

  return (
    <div
      className={`border p-5 ${accentClasses[accent]} ${
        wide ? "w-full" : ""
      }`}
    >

      <div className="flex items-start gap-4">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/85 text-[#766f66]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-center justify-between gap-3">

            <h3 className="font-semibold">
              {title}
            </h3>

            <span className="font-mono text-[10px] text-[#999187]">
              {number}
            </span>

          </div>

          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#a9563d]">
            {subtitle}
          </p>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5951]">
            {description}
          </p>

        </div>

      </div>

    </div>
  );
}


/* ============================================================= */
/* CONNECTOR                                                       */
/* ============================================================= */

function Connector() {
  return (
    <div className="flex h-10 items-center justify-center">

      <div className="flex h-full flex-col items-center">

        <div className="h-4 w-px bg-[#d4cbbf]" />

        <div className="h-2 w-2 rounded-full bg-[#c96b4b]" />

        <div className="h-4 w-px bg-[#d4cbbf]" />

      </div>

    </div>
  );
}


/* ============================================================= */
/* LIFECYCLE                                                       */
/* ============================================================= */

function LifecycleStep({
  number,
  status,
  title,
  description,
  color,
}: {
  number: string;
  status: string;
  title: string;
  description: string;
  color: "neutral" | "terracotta" | "sage";
}) {
  const dot =
    color === "terracotta"
      ? "bg-[#c96b4b]"
      : color === "sage"
        ? "bg-[#66856b]"
        : "bg-[#bcb3a7]";

  return (
    <div className="border-b border-[#ded6ca] p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">

      <div className="flex items-center justify-between">

        <span className="font-mono text-xs text-[#a9563d]">
          {number}
        </span>

        <span className={`h-2 w-2 rounded-full ${dot}`} />

      </div>

      <p className="mt-6 font-mono text-[10px] tracking-[0.1em] text-[#888076]">
        {status}
      </p>

      <h3 className="mt-2 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[#514c46]">
        {description}
      </p>

    </div>
  );
}


/* ============================================================= */
/* ROUTE HEADER                                                    */
/* ============================================================= */

function RouteHeader({
  number,
  label,
  threshold,
  icon,
  color,
}: {
  number: string;
  label: string;
  threshold: string;
  icon: ReactNode;
  color: "terracotta" | "sage";
}) {
  const styles =
    color === "terracotta"
      ? "bg-[#f8e9e2] text-[#c96b4b]"
      : "bg-[#edf3ed] text-[#66856b]";

  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles}`}
        >
          {icon}
        </div>

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#888076]">
            {label}
          </p>

          <p
            className={`mt-1 font-mono text-xs ${
              color === "terracotta"
                ? "text-[#a9563d]"
                : "text-[#66856b]"
            }`}
          >
            {threshold}
          </p>

        </div>

      </div>

      <span className="font-mono text-xs text-[#b2a99d]">
        {number}
      </span>

    </div>
  );
}


/* ============================================================= */
/* INFO STRIP                                                       */
/* ============================================================= */

function InfoStrip({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mt-7 flex items-start gap-4 border-l-2 border-[#c96b4b] bg-[#fffdf9]/65 px-5 py-4">

      <InfoIcon />

      <p className="text-sm leading-7 text-[#514c46]">
        {children}
      </p>

    </div>
  );
}


/* ============================================================= */
/* DATA ROW                                                         */
/* ============================================================= */

function DataRow({
  number,
  title,
  system,
  icon,
  description,
}: {
  number: string;
  title: string;
  system: string;
  icon: ReactNode;
  description: string;
}) {
  return (
    <div className="border-b border-[#ded6ca] p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">

      <div className="flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f1ede4] text-[#766f66]">
          {icon}
        </div>

        <span className="font-mono text-[10px] text-[#a9563d]">
          {number}
        </span>

      </div>

      <h3 className="mt-8 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#a9563d]">
        {system}
      </p>

      <p className="mt-4 text-sm leading-7 text-[#514c46]">
        {description}
      </p>

    </div>
  );
}


/* ============================================================= */
/* REASON ROW                                                       */
/* ============================================================= */

function ReasonRow({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid gap-3 px-5 py-5 sm:grid-cols-[55px_170px_1fr] sm:items-start">

      <span className="font-mono text-xs text-[#a9563d]">
        {number}
      </span>

      <h3 className="font-semibold text-[#292725]">
        {title}
      </h3>

      <p className="text-sm leading-7 text-[#514c46]">
        {text}
      </p>

    </div>
  );
}


/* ============================================================= */
/* RELIABILITY ROW                                                  */
/* ============================================================= */

function ReliabilityRow({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border-b border-[#ded6ca] p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">

      <div className="flex items-start justify-between">

        <div className="text-[#c96b4b]">
          {icon}
        </div>

        <span className="font-mono text-[10px] text-[#a9563d]">
          {number}
        </span>

      </div>

      <h3 className="mt-6 font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[#514c46]">
        {text}
      </p>

    </div>
  );
}


/* ============================================================= */
/* TECHNOLOGY ROW                                                   */
/* ============================================================= */

function TechnologyRow({
  number,
  name,
  role,
  description,
  icon,
}: {
  number: string;
  name: string;
  role: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="group grid gap-5 px-5 py-6 transition-colors hover:bg-[#fdf5f1]/60 sm:grid-cols-[55px_48px_150px_1fr] sm:items-center">

      <span className="font-mono text-[10px] text-[#a9563d]">
        {number}
      </span>

      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f1ede4] text-[#766f66] transition-colors group-hover:bg-[#f8e9e2] group-hover:text-[#c96b4b]">
        {icon}
      </div>

      <div>

        <h3 className="font-semibold">
          {name}
        </h3>

        <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[#888076]">
          {role}
        </p>

      </div>

      <p className="text-sm leading-7 text-[#514c46]">
        {description}
      </p>

    </div>
  );
}


/* ============================================================= */
/* FUTURE ITEM                                                      */
/* ============================================================= */

function FutureItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="border-b border-[#ded6ca] p-7 last:border-b-0 md:[&:nth-child(odd)]:border-r">

      <div className="flex gap-5">

        <span className="shrink-0 font-mono text-xs text-[#a9563d]">
          {number}
        </span>

        <div>

          <div className="flex items-center gap-3">

            <span className="h-1.5 w-1.5 rounded-full bg-[#c96b4b]" />

            <h3 className="text-lg font-semibold">
              {title}
            </h3>

          </div>

          <p className="mt-3 text-sm leading-7 text-[#514c46]">
            {text}
          </p>

        </div>

      </div>

    </div>
  );
}


/* ============================================================= */
/* PROCESS CHIP                                                     */
/* ============================================================= */

function ProcessChip({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 border border-[#ded6ca] bg-[#fbf8f2] px-3 py-2">

      <span className="font-mono text-[9px] text-[#a9563d]">
        {number}
      </span>

      <span className="text-xs text-[#514c46]">
        {text}
      </span>

    </div>
  );
}


/* ============================================================= */
/* ICON WRAPPER                                                     */
/* ============================================================= */

function IconWrapper({
  children,
  size = 19,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}


/* ============================================================= */
/* ICONS                                                            */
/* ============================================================= */

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

function BrowserIcon() {
  return (
    <IconWrapper>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 6.5h.01" />
      <path d="M10 6.5h.01" />
    </IconWrapper>
  );
}

function ServerIcon() {
  return (
    <IconWrapper>
      <rect x="4" y="4" width="16" height="6" rx="1" />
      <rect x="4" y="14" width="16" height="6" rx="1" />
      <path d="M8 7h.01" />
      <path d="M8 17h.01" />
    </IconWrapper>
  );
}

function CloudIcon() {
  return (
    <IconWrapper>
      <path d="M7 18h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.2 9.5A4.5 4.5 0 0 0 7 18Z" />
    </IconWrapper>
  );
}

function DatabaseIcon() {
  return (
    <IconWrapper>
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v7c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
      <path d="M5 12v7c0 1.66 3.13 3 7 3s7-1.34 7-3v-7" />
    </IconWrapper>
  );
}

function WorkerIcon() {
  return (
    <IconWrapper>
      <rect x="5" y="6" width="14" height="12" rx="2" />
      <path d="M9 3v3" />
      <path d="M15 3v3" />
      <path d="M9 18v3" />
      <path d="M15 18v3" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </IconWrapper>
  );
}

function MicIcon() {
  return (
    <IconWrapper>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
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

function DocumentIcon() {
  return (
    <IconWrapper>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h4" />
      <path d="M10 13h5" />
      <path d="M10 17h5" />
    </IconWrapper>
  );
}

function LightningIcon() {
  return (
    <IconWrapper>
      <path d="m13 2-8 11h6l-1 9 8-12h-6z" />
    </IconWrapper>
  );
}

function LayersIcon() {
  return (
    <IconWrapper>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </IconWrapper>
  );
}

function FolderIcon() {
  return (
    <IconWrapper>
      <path d="M3 6h7l2 2h9v11H3z" />
    </IconWrapper>
  );
}

function InfoIcon() {
  return (
    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d8d0c3] text-[#a9563d]">
      <span className="text-xs font-semibold">
        i
      </span>
    </div>
  );
}

function RefreshIcon() {
  return (
    <IconWrapper>
      <path d="M20 11a8 8 0 0 0-14.9-3" />
      <path d="M4 4v5h5" />
      <path d="M4 13a8 8 0 0 0 14.9 3" />
      <path d="M20 20v-5h-5" />
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

function TrashIcon() {
  return (
    <IconWrapper>
      <path d="M4 7h16" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </IconWrapper>
  );
}

function ArrowUpRightIcon() {
  return (
    <IconWrapper size={18}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </IconWrapper>
  );
}