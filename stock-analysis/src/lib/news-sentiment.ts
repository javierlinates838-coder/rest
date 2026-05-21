export type NewsSentiment = "positive" | "negative" | "neutral";

const POSITIVE_KEYWORDS = [
  "surge", "jump", "gain", "rally", "beat", "upgrade", "record", "growth",
  "strong", "profit", "rises", "soar", "bull", "outperform", "exceeds", "positive",
];
const NEGATIVE_KEYWORDS = [
  "fall", "drop", "decline", "loss", "miss", "downgrade", "cut", "weak",
  "crash", "slump", "bear", "risk", "warning", "plunge", "lawsuit", "negative",
];

export function classifyNewsSentiment(headline: string, summary: string): NewsSentiment {
  const text = `${headline} ${summary}`.toLowerCase();
  const posHits = POSITIVE_KEYWORDS.filter((kw) => text.includes(kw)).length;
  const negHits = NEGATIVE_KEYWORDS.filter((kw) => text.includes(kw)).length;
  if (posHits > negHits) return "positive";
  if (negHits > posHits) return "negative";
  return "neutral";
}
