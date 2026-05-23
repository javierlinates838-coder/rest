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
    model.fullDescription &&
    model.fullDescription.length > model.plainEnglish.length + 24;

  return (
    <section className="company-pulse" aria-label={`What is ${quote.symbol}`}>
      <div className="company-pulse-glow" aria-hidden />
      <header className="company-pulse-header">
        <div>
          <p className="company-pulse-eyebrow">{model.eyebrow}</p>
          <h2 className="company-pulse-title">{model.headline}</h2>
          <p className="company-pulse-name">{quote.name}</p>
        </div>
        <span className="company-pulse-badge">Plain English</span>
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

      <p className="company-pulse-lead">{model.elevatorPitch}</p>

      <div className="company-pulse-body">
        <p className={`company-pulse-copy ${expanded ? "" : "company-pulse-copy--clamp"}`}>
          {expanded && showFull ? model.fullDescription : model.plainEnglish}
        </p>
        {showFull && (
          <button
            type="button"
            className="company-pulse-toggle"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Show less" : "Read full company profile"}
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

      <div className="company-pulse-lens">
        <p className="company-pulse-lens-label">Why traders watch it</p>
        <p className="company-pulse-lens-copy">{model.traderLens}</p>
      </div>

      {model.meridianNote && (
        <div className="company-pulse-meridian">
          <p className="company-pulse-lens-label">{TERMS.meridianBrief} snapshot</p>
          <p className="company-pulse-meridian-copy">{model.meridianNote}</p>
        </div>
      )}
    </section>
  );
}
