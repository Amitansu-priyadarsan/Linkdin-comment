"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type ProbeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; detail: string }
  | { status: "error"; detail: string };

const idle: ProbeState = { status: "idle" };

export default function Dashboard() {
  const [health, setHealth] = useState<ProbeState>(idle);
  const [supabase, setSupabase] = useState<ProbeState>(idle);

  const refresh = useCallback(() => {
    const ctrl = new AbortController();

    setHealth({ status: "loading" });
    api.health(ctrl.signal)
      .then((r) => setHealth({ status: "ok", detail: `status: ${r.status}` }))
      .catch((e) => setHealth({ status: "error", detail: String(e.message || e) }));

    setSupabase({ status: "loading" });
    api.supabasePing(ctrl.signal)
      .then((r) =>
        setSupabase({ status: "ok", detail: `rows: ${r.rows?.length ?? 0}` })
      )
      .catch((e) => setSupabase({ status: "error", detail: String(e.message || e) }));

    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const cleanup = refresh();
    return cleanup;
  }, [refresh]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            LinkedIn Comment Assistant — Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            MVP control surface. The Chrome extension is the active surface;
            this page just probes the backend.
          </p>
        </div>
        <button
          onClick={refresh}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Refresh
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <ProbeCard
          title="Backend /health"
          endpoint={`${api.base}/health`}
          state={health}
        />
        <ProbeCard
          title="Supabase /supabase/ping"
          endpoint={`${api.base}/supabase/ping`}
          state={supabase}
        />
      </section>

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Extension
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>1. Load the unpacked extension from <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">frontend/extension/</code> in <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">chrome://extensions</code>.</li>
          <li>2. Sign in to LinkedIn — the floating panel docks to the right of the feed.</li>
          <li>3. Hover a row in the panel to highlight its post. Click <em>Fill comment</em> to pre-fill the comment box.</li>
        </ol>
      </section>
    </main>
  );
}

function ProbeCard({
  title,
  endpoint,
  state,
}: {
  title: string;
  endpoint: string;
  state: ProbeState;
}) {
  const dot = {
    idle: "bg-zinc-300",
    loading: "bg-amber-400 animate-pulse",
    ok: "bg-emerald-500",
    error: "bg-red-500",
  }[state.status];

  const label = {
    idle: "Not checked",
    loading: "Checking…",
    ok: "OK",
    error: "Error",
  }[state.status];

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="flex items-center gap-2 text-xs text-zinc-500">
          <span className={`inline-block size-2 rounded-full ${dot}`} />
          {label}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500 font-mono">{endpoint}</p>
      {"detail" in state && (
        <p
          className={`mt-3 text-xs font-mono ${
            state.status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {state.detail}
        </p>
      )}
    </div>
  );
}
