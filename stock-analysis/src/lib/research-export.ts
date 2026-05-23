/** Build downloadable institutional research brief (Markdown). */

export interface ExportableResearch {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  signal: string;
  confidence: number;
  riskGrade: string;
  edgeScore: number;
  edgeTier: string;
  smartScore: number;
  aiSummary?: string;
  aiRecommendation?: string;
  entry?: number;
  stop?: number;
  target?: number;
  redFlagCount?: number;
  analyzedAt?: string;
}

export function buildResearchMarkdown(r: ExportableResearch): string {
  const date = r.analyzedAt ? new Date(r.analyzedAt).toLocaleString() : new Date().toLocaleString();
  const lines = [
    `# Research Brief — ${r.symbol} · StockPulse`,
    ``,
    `**${r.name}** · ${date}`,
    ``,
    `> Not financial advice.`,
    ``,
    `## Snapshot`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Price | $${r.price.toFixed(2)} (${r.changePercent >= 0 ? "+" : ""}${r.changePercent.toFixed(2)}%) |`,
    `| Signal | **${r.signal}** (${r.confidence}% confidence) |`,
    `| Risk grade | ${r.riskGrade} |`,
    `| Smart Score | ${r.smartScore}/100 |`,
    `| **Pulse Edge Index** | **${r.edgeScore}/100** (${r.edgeTier}) |`,
    ``,
  ];

  if (r.entry || r.stop || r.target) {
    lines.push(`## Trade plan`, ``, `| Level | Price |`, `|-------|-------|`);
    if (r.entry) lines.push(`| Entry zone | $${r.entry.toFixed(2)} |`);
    if (r.stop) lines.push(`| Stop | $${r.stop.toFixed(2)} |`);
    if (r.target) lines.push(`| Target | $${r.target.toFixed(2)} |`);
    lines.push(``);
  }

  if (r.aiSummary) {
    lines.push(`## Summary`, ``, r.aiSummary, ``);
  }
  if (r.aiRecommendation && r.aiRecommendation !== r.signal) {
    lines.push(`**Recommendation:** ${r.aiRecommendation}`, ``);
  }

  if (r.redFlagCount && r.redFlagCount > 0) {
    lines.push(`## Risk`, ``, `${r.redFlagCount} active risk flag(s) — review Red Flags tab in StockPulse.`, ``);
  }

  lines.push(
    `---`,
    `*Exported from [StockPulse](https://stockpulse.app) — Edge Index, Smart Score, and ATR trade plans in one terminal.*`
  );

  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
