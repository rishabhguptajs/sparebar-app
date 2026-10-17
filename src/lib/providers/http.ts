import { ProviderError, type ReferenceImage } from "./types";

export function dataUri(r: ReferenceImage) {
  return `data:${r.mime};base64,${r.base64}`;
}

/**
 * The supported aspect ratio closest to the one asked for. Labs accept different lists, and
 * for example 4:5 is not accepted by all of them.
 */
export function nearestRatio(want: string | undefined, supported: readonly string[], fallback = "9:16"): string {
  const value = (r: string) => {
    const [w, h] = r.split(":").map(Number);
    return w / h;
  };
  const target = want ?? fallback;
  if (supported.includes(target)) return target;
  const t = Math.log(value(target));
  return [...supported].sort((a, b) => Math.abs(Math.log(value(a)) - t) - Math.abs(Math.log(value(b)) - t))[0];
}

function messageFrom(body: unknown, text: string): string {
  const b = body as { error?: { message?: string } | string; message?: string; msg?: string; base_resp?: { status_msg?: string } } | null;
  if (b && typeof b === "object") {
    if (typeof b.error === "object" && b.error?.message) return b.error.message;
    if (typeof b.error === "string") return b.error;
    if (b.message) return b.message;
    if (b.msg) return b.msg;
    if (b.base_resp?.status_msg) return b.base_resp.status_msg;
  }
  return text.slice(0, 300);
}

/** JSON request to a lab. Throws ProviderError with the HTTP status so billing errors can be told apart. */
export async function api<T>(
  label: string,
  url: string,
  opts: { key: string; method?: "GET" | "POST"; body?: unknown; headers?: Record<string, string> },
): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body === undefined ? "GET" : "POST"),
    headers: {
      Authorization: `Bearer ${opts.key}`,
      ...(opts.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...opts.headers,
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    cache: "no-store",
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON; the raw text is used for the message
  }
  if (!res.ok) {
    const permanent = res.status >= 400 && res.status < 500 && res.status !== 429;
    throw new ProviderError(`${label} ${res.status}: ${messageFrom(body, text)}`, permanent, res.status);
  }
  return body as T;
}

/** Fetch a finished file. Result links are temporary, so this runs as soon as the job succeeds. */
export async function download(label: string, url: string, fallbackMime: string, headers?: Record<string, string>) {
  const res = await fetch(url, { headers, cache: "no-store" });
  // No status is attached: an expired result link returns 403, which must not read as a billing problem.
  if (!res.ok) throw new ProviderError(`${label} download ${res.status}`, false);
  const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || fallbackMime;
  return { mime: mime.startsWith("image/") || mime.startsWith("video/") ? mime : fallbackMime, bytes: new Uint8Array(await res.arrayBuffer()) };
}

export function requireKey(name: string): string {
  const key = process.env[name];
  if (!key) throw new ProviderError(`${name} is not set`, true, 401);
  return key;
}
