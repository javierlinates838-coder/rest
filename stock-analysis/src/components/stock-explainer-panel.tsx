"use client";

import { useMemo, useState } from "react";
import { buildStockExplainer, type StockExplainerInput } from "@/lib/stock-explainer";
import { TERMS } from "@/lib/brand";

export function StockExplainerPanel({
  quote,
  aiSummary,
}: {
  quote: StockExplainerInput;
  aiSummary?: string;
}) {
  const model = useMemo(() => buildStockExplainer(quote, aiSummary), [quote, aiSummary]);
  const [expanded, setExpanded] = useState(false);

  const showFull =
    model.fullDescription && model.fullDescription.length > model.body.length + 24;

  return (
    <section className="company-pulse" aria-label={`${quote.symbol} company profile`}>
      <header className="company-pulse-header">
        <div>
          <p className="company-pulse-eyebrow">{model.eyebrow}</p>
          <h2 className="company-pulse-title">{model.headline}</h2>
        </div>
      </header>

      {model.tags.length > 0 && (
        <div className="company-pulse-tags">
          {model.tags.map((tag) => (
            <span key={tag} className="company-pulse-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="company-pulse-lead">{model.summary}</p>

      <div className="company-pulse-body">
        <p className={`company-pulse-copy ${expanded ? "" : "company-pulse-copy--clamp"}`}>
          {expanded && showFull ? model.fullDescription : model.body}
        </p>
        {showFull && (
          <button
            type="button"
            className="company-pulse-toggle"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Less" : "Full profile"}
          </button>
        )}
      </div>

      {model.facts.length > 0 && (
        <div className="company-pulse-facts">
          {model.facts.map((fact) => (
            <div key={`${fact.label}-${fact.value}`} className="company-pulse-fact">
              <span className="company-pulse-fact-label">{fact.label}</span>
              {fact.href ? (
                <a
                  href={fact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="company-pulse-fact-value company-pulse-fact-link"
                >
                  {fact.value}
                </a>
              ) : (
                <span className="company-pulse-fact-value">{fact.value}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {model.marketContext && (
        <div className="company-pulse-lens">
          <p className="company-pulse-lens-label">Market context</p>
          <p className="company-pulse-lens-copy">{model.marketContext}</p>
        </div>
      )}

      {model.researchNote && (
        <div className="company-pulse-research">
          <p className="company-pulse-lens-label">{TERMS.meridianBrief}</p>
          <p className="company-pulse-research-copy">{model.researchNote}</p>
        </div>
      )}
    </section>
  );
}
