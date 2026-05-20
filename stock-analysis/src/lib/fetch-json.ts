import { normalizeAnalysisPayload } from "./normalize-analysis";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
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
  const raw = await fetchJson<QuoteSummary>(
    `/api/analyze?symbol=${encodeURIComponent(symbol)}`
  );
  const data = normalizeAnalysisPayload(raw) as QuoteSummary | null;
  if (!hasQuotePayload(data)) {
    throw new ApiError("Invalid quote data from server", 502);
  }
  return data;
}
