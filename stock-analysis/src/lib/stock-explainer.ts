/** Plain-English company explainer — builds copy from quote + optional AI context. */

export interface StockExplainerInput {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  exchange: string;
  description: string;
  marketCap: number;
  peRatio: number;
  beta: number;
  dividendYield: number;
  website?: string;
  ceo?: string;
  country?: string;
  employees?: number;
}

export interface StockExplainerFact {
  label: string;
  value: string;
  href?: string;
}

export interface StockExplainerModel {
  headline: string;
  eyebrow: string;
  elevatorPitch: string;
  plainEnglish: string;
  fullDescription: string | null;
  traderLens: string;
  sizeLabel: string;
  facts: StockExplainerFact[];
  tags: string[];
  meridianNote: string | null;
}

/** Curated one-liners when feeds are thin — keeps the panel useful offline. */
const KNOWLEDGE: Record<string, string> = {
  AAPL:
    "Designs iPhone, Mac, and services (App Store, iCloud) — one of the world's largest consumer tech ecosystems.",
  MSFT:
    "Cloud and software giant behind Windows, Office, Azure, and Xbox — a core holding for enterprise and AI infrastructure.",
  GOOGL:
    "Search and advertising leader (Google) plus YouTube, Android, and cloud — revenue tied to digital ad spend.",
  AMZN:
    "E-commerce and logistics leader with AWS cloud — margins swing on retail efficiency and cloud growth.",
  TSLA:
    "Electric vehicles, energy storage, and autonomy — high-beta name driven by deliveries, margins, and Elon headlines.",
  META:
    "Social platforms (Facebook, Instagram, WhatsApp) monetized through ads — Reels and AI ad tools move the narrative.",
  NVDA:
    "Designs GPUs for gaming and AI data centers — the benchmark chip name when AI capex cycles heat up.",
  JPM:
    "Largest U.S. bank by assets — profits track interest rates, loan growth, and credit quality.",
  V:
    "Payment network (not a bank) — earns fees on card volume; macro consumer spend drives the tape.",
  JNJ:
    "Healthcare conglomerate spanning pharma and medtech — defensive, dividend-oriented large cap.",
  AMD:
    "CPU and GPU challenger to Intel and NVIDIA — data-center share gains and PC cycles drive volatility.",
  NFLX:
    "Global streaming subscription business — subscriber adds, content spend, and ad tier monetization move the stock.",
  DIS:
    "Theme parks, ESPN, Disney+, and studio content — parks cash flow and streaming subs are the key investor debates.",
  BA:
    "Commercial and defense aerospace — order book, delivery cadence, and safety headlines dominate.",
  INTC:
    "Legacy x86 chipmaker pivoting foundry and AI PC — turnaround story with heavy capex and execution risk.",
};

function firstSentences(text: string, maxChars = 280): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) return cleaned;
  const slice = cleaned.slice(0, maxChars);
  const lastPeriod = slice.lastIndexOf(". ");
  if (lastPeriod > 80) return slice.slice(0, lastPeriod + 1);
  return `${slice.trim()}…`;
}

function marketCapTier(cap: number): string {
  if (cap >= 200e9) return "Mega-cap";
  if (cap >= 10e9) return "Large-cap";
  if (cap >= 2e9) return "Mid-cap";
  if (cap > 0) return "Small-cap";
  return "Size unknown";
}

function formatEmployees(n?: number): string | null {
  if (!n || n <= 0) return null;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M employees`;
  if (n >= 1e3) return `${Math.round(n / 1000)}K employees`;
  return `${n.toLocaleString()} employees`;
}

function buildTraderLens(input: StockExplainerInput): string {
  const parts: string[] = [];
  const tier = marketCapTier(input.marketCap);
  if (input.marketCap > 0) {
    parts.push(
      tier === "Mega-cap"
        ? "Index and passive flows matter — macro and sector rotation show up fast."
        : tier === "Large-cap"
          ? "Liquid large cap — earnings and guidance usually set the next leg."
          : tier === "Mid-cap"
            ? "Mid-cap swing name — can outperform in risk-on tape but gaps on misses."
            : "Smaller float — watch liquidity and spread before sizing."
    );
  }

  if (input.beta >= 1.35) {
    parts.push("High beta — moves harder than the broad market on headlines.");
  } else if (input.beta > 0 && input.beta <= 0.85) {
    parts.push("Lower beta — tends to hold up better in selloffs, lags in melt-ups.");
  }

  if (input.dividendYield >= 1.5) {
    parts.push(`Dividend yield ~${input.dividendYield.toFixed(1)}% — income holders add a valuation anchor.`);
  }

  if (input.sector) {
    parts.push(`Grouped in ${input.sector} — sector ETF flows can drag ${input.symbol} even without company news.`);
  }

  return parts.slice(0, 3).join(" ");
}

function buildElevatorPitch(input: StockExplainerInput): string {
  const known = KNOWLEDGE[input.symbol.toUpperCase()];
  if (known) return known;

  if (input.description && input.description.length > 40) {
    return firstSentences(input.description, 220);
  }

  const industry = input.industry || input.sector;
  if (industry) {
    return `${input.name} (${input.symbol}) is a publicly traded ${industry.toLowerCase()} company listed on ${input.exchange || "U.S. markets"}.`;
  }

  return `${input.name} (${input.symbol}) is a listed equity — expand the full profile below when data feeds populate.`;
}

function buildPlainEnglish(input: StockExplainerInput, pitch: string): string {
  if (input.description && input.description.length > 60) {
    return firstSentences(input.description, 420);
  }
  return pitch;
}

function meridianFromAi(aiSummary?: string): string | null {
  if (!aiSummary || aiSummary.length < 20) return null;
  const sentence = aiSummary.split(/(?<=[.!?])\s+/)[0]?.trim();
  if (!sentence || sentence.length < 24) return null;
  return firstSentences(sentence, 200);
}

export function buildStockExplainer(
  input: StockExplainerInput,
  aiSummary?: string
): StockExplainerModel {
  const elevatorPitch = buildElevatorPitch(input);
  const plainEnglish = buildPlainEnglish(input, elevatorPitch);
  const fullDescription =
    input.description && input.description.length > plainEnglish.length + 20
      ? input.description.trim()
      : input.description.length > 80
        ? input.description.trim()
        : null;

  const facts: StockExplainerFact[] = [];
  if (input.sector) facts.push({ label: "Sector", value: input.sector });
  if (input.industry && input.industry !== input.sector) {
    facts.push({ label: "Industry", value: input.industry });
  }
  if (input.exchange) facts.push({ label: "Exchange", value: input.exchange });
  if (input.country) facts.push({ label: "HQ", value: input.country });
  if (input.ceo) facts.push({ label: "CEO", value: input.ceo });
  const emp = formatEmployees(input.employees);
  if (emp) facts.push({ label: "Scale", value: emp });
  if (input.marketCap > 0) facts.push({ label: "Market cap tier", value: marketCapTier(input.marketCap) });
  if (input.peRatio > 0) facts.push({ label: "P/E (TTM)", value: input.peRatio.toFixed(1) });
  if (input.beta > 0) facts.push({ label: "Beta", value: input.beta.toFixed(2) });
  if (input.website) {
    const href = input.website.startsWith("http") ? input.website : `https://${input.website}`;
    facts.push({ label: "Website", value: input.website.replace(/^https?:\/\//, ""), href });
  }

  const tags = [input.sector, input.industry, marketCapTier(input.marketCap)]
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i) as string[];

  return {
    headline: `What is ${input.symbol}?`,
    eyebrow: "Company Pulse",
    elevatorPitch,
    plainEnglish,
    fullDescription: fullDescription && fullDescription !== plainEnglish ? fullDescription : fullDescription,
    traderLens: buildTraderLens(input),
    sizeLabel: marketCapTier(input.marketCap),
    facts,
    tags,
    meridianNote: meridianFromAi(aiSummary),
  };
}
