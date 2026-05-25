// Tiny fetch wrapper around the FastAPI backend.
// Configurable via NEXT_PUBLIC_API_BASE so dev can point at localhost
// and prod can point at a deployed URL without code changes.

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:8000";

export type HealthResponse = { status: string };
export type SupabasePingResponse = { ok: boolean; rows: unknown[] };

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal, cache: "no-store" });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  base: API_BASE,
  health: (signal?: AbortSignal) => getJson<HealthResponse>("/health", signal),
  supabasePing: (signal?: AbortSignal) =>
    getJson<SupabasePingResponse>("/supabase/ping", signal),
};
