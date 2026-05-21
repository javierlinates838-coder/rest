/** Per-symbol investment horizon & style — derived from live quote + technicals (not static copy). */

export interface InvestmentProfileInput {
  symbol: string;
  price: number;
  beta: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  sector: string;
  industry: string;
  changePercent: number;
  rsi: number;
  adx: number;
  atr: number;
  signal: string;
  confidence: number;
}

export interface DerivedHorizon {
  label: string;
  rationale: string;
  tradingTimeframe: string;
  weeksMin: number;
  weeksMax: number;
}

function symbolHash(symbol: string): number {
  return symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function deriveTimeHorizon(input: InvestmentProfileInput): DerivedHorizon {
  const sym = input.symbol.toUpperCase();
  const hash = symbolHash(sym);
  let score = 0;

  if (input.marketCap >= 200e9) score += 2.5;
  else if (input.marketCap >= 50e9) score += 1.5;
  else if (input.marketCap >= 10e9) score += 0.5;
  else if (input.marketCap < 2e9) score -= 1.5;
  else if (input.marketCap < 5e9) score -= 0.5;

  if (input.beta >= 1.75) score -= 2;
  else if (input.beta >= 1.35) score -= 1;
  else if (input.beta <= 0.75) score += 1.25;
  else if (input.beta <= 0.95) score += 0.5;

  if (input.dividendYield >= 2.5) score += 2;
  else if (input.dividendYield >= 1) score += 1;
  else if (input.dividendYield >= 0.35) score += 0.25;

  const volPct = input.price > 0 ? input.atr / input.price : 0.02;
  if (volPct >= 0.045) score -= 1.5;
  else if (volPct >= 0.03) score -= 0.75;
  else if (volPct <= 0.012) score += 0.5;

  if (input.adx >= 30 && input.confidence >= 55) score -= 1;
  else if (input.adx < 18) score += 0.35;

  if (input.rsi <= 28 || input.rsi >= 72) score -= 0.85;

  const tactical =
    /strong buy|strong sell/i.test(input.signal) ||
    (/buy|sell/i.test(input.signal) && input.confidence >= 62);
  if (tactical) score -= 1.25;
  if (input.signal === "Hold" && input.confidence < 45) score += 0.75;

  const sector = `${input.sector} ${input.industry}`.toLowerCase();
  if (/utilities|consumer defensive|staples|reit|insurance/.test(sector)) score += 1.25;
  if (/biotech|semiconductor|software|internet|crypto|airline/.test(sector)) score -= 0.65;
  if (/financial|bank/.test(sector) && input.beta > 1.1) score -= 0.35;

  if (Math.abs(input.changePercent) >= 4 && volPct >= 0.03) score -= 0.5;

  score += ((hash % 7) - 3) * 0.12;

  const parts: string[] = [];
  if (input.beta >= 1.35) parts.push(`beta ${input.beta.toFixed(2)}`);
  if (input.marketCap >= 50e9) parts.push("large-cap");
  else if (input.marketCap < 5e9) parts.push("smaller-cap");
  if (input.dividendYield >= 1) parts.push(`${input.dividendYield.toFixed(1)}% yield`);
  if (input.adx >= 28) parts.push(`ADX ${input.adx.toFixed(0)} trend`);
  if (tactical) parts.push(`${input.signal} setup`);
  if (volPct >= 0.035) parts.push("elevated volatility");

  const rationale =
    parts.length > 0
      ? `Tailored to ${sym}: ${parts.slice(0, 4).join(" · ")}`
      : `Tailored to ${sym} technicals and ${input.sector || "sector"} profile`;

  if (score <= -2.5) {
    return {
      label: "Tactical (2–6 weeks)",
      rationale,
      tradingTimeframe: "2–6 weeks · momentum / event trade",
      weeksMin: 2,
      weeksMax: 6,
    };
  }
  if (score <= -0.75) {
    return {
      label: "Short-term (1–3 months)",
      rationale,
      tradingTimeframe: "4–12 weeks · swing trade",
      weeksMin: 4,
      weeksMax: 12,
    };
  }
  if (score <= 1.25) {
    const wMin = 10 + (hash % 4);
    const wMax = wMin + 14 + (hash % 6);
    return {
      label: `Swing (${wMin}–${wMax} weeks)`,
      rationale,
      tradingTimeframe: `${wMin}–${wMax} weeks · position build`,
      weeksMin: wMin,
      weeksMax: wMax,
    };
  }
  if (score <= 2.75) {
    return {
      label: "Position (6–14 months)",
      rationale,
      tradingTimeframe: "6–14 months · core position",
      weeksMin: 26,
      weeksMax: 60,
    };
  }
  return {
    label: "Core hold (1–3 years)",
    rationale,
    tradingTimeframe: "12–36 months · long-term compounder",
    weeksMin: 52,
    weeksMax: 156,
  };
}

const GENERIC_HORIZON =
  /^(short|medium|long)[-\s]?term|medium-term \(3-12 months\)|short-term \(1-3 months\)|long-term \(1-3 years\)$/i;

export function isGenericTimeHorizon(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  const v = value.trim();
  if (GENERIC_HORIZON.test(v)) return true;
  if (/^medium-term \(3-12 months\)$/i.test(v)) return true;
  return false;
}

export function deriveSentimentScore(
  aiScore: number | undefined,
  news: { sentiment: string }[],
  indicators: { rsi: number },
  signal: { signal: string; confidence: number }
): number {
  if (typeof aiScore === "number" && Number.isFinite(aiScore) && Math.abs(aiScore) > 8) {
    return Math.max(-100, Math.min(100, Math.round(aiScore)));
  }

  let score = 0;
  for (const n of news) {
    if (n.sentiment === "positive") score += 12;
    else if (n.sentiment === "negative") score -= 12;
  }
  if (indicators.rsi < 32) score += 15;
  else if (indicators.rsi > 68) score -= 12;
  if (/buy/i.test(signal.signal)) score += signal.confidence * 0.25;
  if (/sell/i.test(signal.signal)) score -= signal.confidence * 0.25;

  return Math.max(-100, Math.min(100, Math.round(score)));
}

export function ensureSymbolInBullets(
  symbol: string,
  items: string[],
  fallback: string[],
  max = 5
): string[] {
  const sym = symbol.toUpperCase();
  const cleaned = items.filter((s) => typeof s === "string" && s.trim().length > 8);
  const withSymbol = cleaned.map((s) =>
    s.toUpperCase().includes(sym) ? s : `${sym}: ${s.replace(/^[A-Z]{1,5}:\s*/i, "")}`
  );
  const base = withSymbol.length >= 3 ? withSymbol : fallback;
  return base.slice(0, max);
}
