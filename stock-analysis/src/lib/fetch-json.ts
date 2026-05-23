import { userFacingFetchError } from "./display-labels";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function errorMessageFromBody(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
    return userFacingFetchError(data.error);
  }
  return `Request failed (${status})`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(errorMessageFromBody(data, res.status), res.status);
  }

  if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
    throw new ApiError(data.error, res.status || 500);
  }

  return data as T;
}

/** Same as fetchJson but with an abort timeout (critical for slow /api/analyze on Vercel). */
export async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs = 55000,
  init?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchJson<T>(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError(
        "Analysis took too long. Try again in a moment, or check that live data services are connected on the server.",
        504
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export interface QuoteSummary {
  quote: {
    name: string;
    price: number;
    changePercent: number;
  };
  signal?: {
    signal: string;
    confidence: number;
  };
}

export function hasQuotePayload(data: unknown): data is QuoteSummary {
  if (!data || typeof data !== "object") return false;
  const q = (data as QuoteSummary).quote;
  return Boolean(q && typeof q.price === "number");
}

export async function fetchQuoteSummary(symbol: string): Promise<QuoteSummary> {
  const data = await fetchJson<QuoteSummary>(
    `/api/quote?symbol=${encodeURIComponent(symbol)}`
  );
  if (!hasQuotePayload(data)) {
    throw new ApiError("Invalid quote data from server", 502);
  }
  return data;
}
