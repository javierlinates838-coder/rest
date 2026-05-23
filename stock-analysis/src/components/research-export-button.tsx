"use client";

import { buildResearchMarkdown, downloadMarkdown, type ExportableResearch } from "@/lib/research-export";

interface ResearchExportButtonProps {
  data: ExportableResearch;
}

export function ResearchExportButton({ data }: ResearchExportButtonProps) {
  const handleExport = () => {
    const md = buildResearchMarkdown(data);
    downloadMarkdown(`StockPulse-${data.symbol}-brief.md`, md);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="pressable flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-200 text-[12px] font-semibold hover:bg-teal-500/20"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export brief
    </button>
  );
}
