/** User-facing labels — never expose env var names, vendors, or deploy tooling. */

const BLANK_LABEL = /^$|^(unknown|n\/a|na|null|undefined|—|-)$/i;

/** Strip placeholder junk; use before storing or showing labels. */
export function cleanDisplayLabel(value?: string | null): string {
  const s = (value ?? "").trim();
  if (!s || BLANK_LABEL.test(s)) return "";
  if (/^unknown$/i.test(s)) return "";
  return s;
}

/** Value for UI tables and stats — em dash when missing. */
export function displayOrDash(value?: string | null): string {
  return cleanDisplayLabel(value) || "—";
}

export function formatDataSourceLabel(raw: string): string {
  const s = raw.trim();
  if (!s) return "";

  if (/simulated|set fmp/i.test(s)) return "Estimated prices";
  if (/built-in engine/i.test(s)) return "Built-in analysis";
  if (/model estimate/i.test(s)) return "Model estimate";
  if (/estimated calendar/i.test(s)) return "Est. calendar";
  if (/fmp|yahoo|finnhub|newsapi|gemini|openai|gpt/i.test(s)) return "Live market data";
  if (/generated/i.test(s)) return "Illustrative";

  return "";
}

export function chartDataLabel(source: "fmp" | "yahoo" | "simulated" | "unknown"): string | null {
  if (source === "simulated") return "Estimated prices";
  if (source === "fmp" || source === "yahoo") return "Live data";
  return null;
}

export function aiEngineLabel(_dataSources?: { ai?: string }): string {
  return "AI-assisted research brief";
}

export function userFacingFetchError(message: string): string {
  return message
    .replace(/FMP_API_KEY|FINNHUB_API_KEY|NEWS_API_KEY|GEMINI_API_KEY/gi, "market data")
    .replace(/Vercel/gi, "server")
    .replace(/10s limit/gi, "time limit")
    .replace(/set FMP_API_KEY/gi, "connect live market data")
    .replace(/API keys are missing[^.]*\.?/gi, "Live data is temporarily unavailable.")
    .replace(/\bFMP\b|\bFinnhub\b|\bNewsAPI\b|\bGemini\b|\bYahoo Finance\b/gi, "market data");
}
