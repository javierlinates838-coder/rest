/** Company profile copy from quote data and optional research summary. */

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
  summary: string;
  body: string;
  fullDescription: string | null;
  marketContext: string;
  sizeLabel: string;
  facts: StockExplainerFact[];
  tags: string[];
  researchNote: string | null;
}

const KNOWLEDGE: Record<string, string> = {
  AAPL: "Makes iPhone, Mac, and a services stack (App Store, iCloud). One of the largest consumer tech businesses on the index.",
  MSFT: "Windows, Office, Azure, and Xbox. Enterprise software and cloud revenue drive the model.",
  GOOGL: "Google search and ads, YouTube, Android, and cloud. Top line moves with digital ad budgets.",
  AMZN: "E-commerce, logistics, and AWS. Retail margins and cloud growth set the quarterly narrative.",
  TSLA: "EVs, batteries, and energy. Deliveries, auto gross margin, and headline risk around the brand.",
  META: "Facebook, Instagram, WhatsApp. Almost all revenue is advertising; Reels and ad tooling matter for growth.",
  NVDA: "GPUs for gaming and data centers. Sensitive to AI and cloud capex cycles.",
  JPM: "Largest U.S. bank by assets. Net interest income, loan growth, and credit losses move the stock.",
  V: "Card network, not a bank. Fees on payment volume; tracks consumer spending.",
  JNJ: "Pharma and medtech under one roof. Often treated as a defensive, dividend name.",
  AMD: "CPUs and GPUs vs Intel and NVIDIA. Data-center share and PC demand drive swings.",
  NFLX: "Global streaming subscriptions. Sub adds, content spend, and the ad tier are the usual debates.",
  DIS: "Parks, ESPN, Disney+, and film. Park cash flow vs streaming profitability is the split investors watch.",
  BA: "Commercial and defense jets. Order book, delivery pace, and safety news dominate.",
  INTC: "x86 chips and a foundry pivot. Heavy capex; execution on process and share matters.",
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
  return "Unknown size";
}

function formatEmployees(n?: number): string | null {
  if (!n || n <= 0) return null;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M people`;
  if (n >= 1e3) return `${Math.round(n / 1000)}K people`;
  return `${n.toLocaleString()} people`;
}

function buildMarketContext(input: StockExplainerInput): string {
  const parts: string[] = [];
  const tier = marketCapTier(input.marketCap);

  if (input.marketCap > 0) {
    if (tier === "Mega-cap") parts.push("Index weight matters. Macro and sector rotation show up in the tape.");
    else if (tier === "Large-cap") parts.push("Liquid name. Earnings and guidance usually set the next move.");
    else if (tier === "Mid-cap") parts.push("Can outperform in risk-on markets; gaps hard on misses.");
    else parts.push("Check liquidity and spread before size.");
  }

  if (input.beta >= 1.35) parts.push(`Beta ${input.beta.toFixed(2)}: moves more than the broad market.`);
  else if (input.beta > 0 && input.beta <= 0.85) {
    parts.push(`Beta ${input.beta.toFixed(2)}: usually calmer than the index.`);
  }

  if (input.dividendYield >= 1.5) {
    parts.push(`Yield about ${input.dividendYield.toFixed(1)}%. Income holders affect the bid.`);
  }

  if (input.sector && parts.length < 3) {
    parts.push(`${input.sector} sector flows can move ${input.symbol} without company-specific news.`);
  }

  return parts.slice(0, 3).join(" ");
}

function buildSummary(input: StockExplainerInput): string {
  const known = KNOWLEDGE[input.symbol.toUpperCase()];
  if (known) return known;

  if (input.description && input.description.length > 40) {
    return firstSentences(input.description, 220);
  }

  const industry = input.industry || input.sector;
  if (industry) {
    return `${input.name} (${input.symbol}) trades in ${industry.toLowerCase()} on ${input.exchange || "U.S. markets"}.`;
  }

  return `${input.name} (${input.symbol}). Profile fills in when company data loads.`;
}

function researchFromSummary(aiSummary?: string): string | null {
  if (!aiSummary || aiSummary.length < 20) return null;
  const sentence = aiSummary.split(/(?<=[.!?])\s+/)[0]?.trim();
  if (!sentence || sentence.length < 24) return null;
  return firstSentences(sentence, 200);
}

export function buildStockExplainer(
  input: StockExplainerInput,
  aiSummary?: string
): StockExplainerModel {
  const summary = buildSummary(input);
  const body =
    input.description && input.description.length > 60
      ? firstSentences(input.description, 420)
      : summary;

  const fullDescription =
    input.description && input.description.length > body.length + 20
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
  if (emp) facts.push({ label: "Headcount", value: emp });
  if (input.marketCap > 0) facts.push({ label: "Cap tier", value: marketCapTier(input.marketCap) });
  if (input.peRatio > 0) facts.push({ label: "P/E (TTM)", value: input.peRatio.toFixed(1) });
  if (input.beta > 0) facts.push({ label: "Beta", value: input.beta.toFixed(2) });
  if (input.website) {
    const href = input.website.startsWith("http") ? input.website : `https://${input.website}`;
    facts.push({ label: "Site", value: input.website.replace(/^https?:\/\//, ""), href });
  }

  const tags = [input.sector, input.industry, marketCapTier(input.marketCap)]
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i) as string[];

  return {
    headline: input.name,
    eyebrow: `${input.symbol} · ${input.exchange || "Listed"}`,
    summary,
    body,
    fullDescription: fullDescription && fullDescription !== body ? fullDescription : fullDescription,
    marketContext: buildMarketContext(input),
    sizeLabel: marketCapTier(input.marketCap),
    facts,
    tags,
    researchNote: researchFromSummary(aiSummary),
  };
}
