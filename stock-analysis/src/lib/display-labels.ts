/** User-facing labels — never expose env var names or deploy tooling. */

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
  if (!s) return "Data";

  if (/simulated|set fmp/i.test(s)) return "Simulated chart";
  if (/built-in engine/i.test(s)) return "Built-in AI";
  if (/model estimate/i.test(s)) return "Model estimate";
  if (/estimated calendar/i.test(s)) return "Est. calendar";
  if (/fmp live|fmp$/i.test(s)) return "FMP";
  if (/yahoo/i.test(s)) return "Yahoo";
  if (/gemini/i.test(s)) return "Gemini";
  if (/openai|gpt/i.test(s)) return "OpenAI";
  if (/finnhub.*newsapi|newsapi.*finnhub/i.test(s)) return "Finnhub+News";
  if (/finnhub/i.test(s)) return "Finnhub";
  if (/newsapi/i.test(s)) return "NewsAPI";
  if (/generated/i.test(s)) return "Illustrative";

  return s.length > 18 ? `${s.slice(0, 18)}…` : s;
}

export function aiEngineLabel(dataSources?: { ai?: string }): string {
  const ai = dataSources?.ai || "";
  if (/gemini/i.test(ai)) return "Powered by Google Gemini";
  if (/openai|gpt/i.test(ai)) return "Powered by OpenAI";
  return "Powered by quantitative models + market data";
}

export function userFacingFetchError(message: string): string {
  return message
    .replace(/FMP_API_KEY|FINNHUB_API_KEY|NEWS_API_KEY|GEMINI_API_KEY/gi, "market data keys")
    .replace(/Vercel/gi, "server")
    .replace(/10s limit/gi, "time limit")
    .replace(/set FMP_API_KEY/gi, "connect live market data");
}
