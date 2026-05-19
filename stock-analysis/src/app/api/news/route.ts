import { NextRequest, NextResponse } from "next/server";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
  relevance: number;
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") || "MARKET";

  const news = generateNewsForSymbol(symbol);

  return NextResponse.json({ news, symbol });
}

function generateNewsForSymbol(symbol: string): NewsItem[] {
  const templates = [
    {
      title: `${symbol} Surpasses Analyst Expectations in Latest Quarter`,
      source: "Financial Times",
      sentiment: "positive" as const,
      summary: `${symbol} reported earnings that beat Wall Street estimates, driven by strong revenue growth and margin expansion. The company raised its full-year guidance, sending shares higher in after-hours trading.`,
    },
    {
      title: `Institutional Investors Increase Stakes in ${symbol}`,
      source: "Bloomberg",
      sentiment: "positive" as const,
      summary: `Major hedge funds and institutional investors have been accumulating shares of ${symbol}, signaling strong confidence in the company's long-term growth prospects.`,
    },
    {
      title: `${symbol} Faces Regulatory Headwinds in Key Markets`,
      source: "Reuters",
      sentiment: "negative" as const,
      summary: `New regulatory proposals could impact ${symbol}'s operations in several key markets. Analysts are assessing the potential impact on revenue and profitability.`,
    },
    {
      title: `Analyst Roundup: Mixed Views on ${symbol}'s Valuation`,
      source: "MarketWatch",
      sentiment: "neutral" as const,
      summary: `Wall Street analysts are divided on ${symbol}'s current valuation. While some see upside potential, others caution that the premium pricing leaves little margin for error.`,
    },
    {
      title: `${symbol} Announces Strategic Partnership to Drive Innovation`,
      source: "CNBC",
      sentiment: "positive" as const,
      summary: `${symbol} has entered a new strategic partnership aimed at accelerating product development and expanding into adjacent markets. The deal is expected to contribute to revenue growth.`,
    },
    {
      title: `Market Volatility: How ${symbol} Is Positioned for Uncertainty`,
      source: "Wall Street Journal",
      sentiment: "neutral" as const,
      summary: `As market volatility persists, analysts evaluate how ${symbol}'s business model and financial position can weather economic headwinds. The company's diversified revenue base may offer resilience.`,
    },
    {
      title: `${symbol} Insider Selling Raises Questions Among Investors`,
      source: "Barron's",
      sentiment: "negative" as const,
      summary: `Recent SEC filings reveal significant insider selling at ${symbol}. While insiders sell for various reasons, the timing and volume have caught the attention of market watchers.`,
    },
    {
      title: `${symbol} Expands AI Capabilities with Major Investment`,
      source: "TechCrunch",
      sentiment: "positive" as const,
      summary: `${symbol} is investing heavily in artificial intelligence capabilities, with the company announcing plans to integrate AI across its product suite. This positions the company at the forefront of the AI revolution.`,
    },
    {
      title: `Supply Chain Disruptions May Impact ${symbol} in Coming Quarters`,
      source: "Bloomberg",
      sentiment: "negative" as const,
      summary: `Ongoing supply chain challenges could affect ${symbol}'s ability to meet demand in the near term. Management has acknowledged the situation and is working on mitigation strategies.`,
    },
    {
      title: `${symbol} Stock: Technical Analysis Points to Key Support Level`,
      source: "Investor's Business Daily",
      sentiment: "neutral" as const,
      summary: `Technical charts for ${symbol} show the stock approaching a critical support level. A bounce here could signal a new uptrend, while a break below might lead to further selling pressure.`,
    },
  ];

  const now = Date.now();
  return templates.map((t, i) => ({
    id: `news-${symbol}-${i}`,
    title: t.title,
    source: t.source,
    url: "#",
    publishedAt: new Date(now - i * 3600000 * (i + 1)).toISOString(),
    sentiment: t.sentiment,
    summary: t.summary,
    relevance: Math.round(95 - i * 5),
  }));
}
