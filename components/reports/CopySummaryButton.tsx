"use client";

import { useState } from "react";
import { ReportSummaryData, formatReportSummary } from "@/lib/reportSummary";

interface Props {
  data: ReportSummaryData;
}

export function CopySummaryButton({ data }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    const text = formatReportSummary(data);
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={data.totalMs === 0}
      title={data.totalMs === 0 ? "No data to copy" : "Copy formatted summary to clipboard"}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
        border transition-all duration-150
        disabled:opacity-30 disabled:cursor-not-allowed
        ${
          state === "copied"
            ? "bg-green-500/20 border-green-500/40 text-green-300"
            : state === "error"
            ? "bg-red-500/20 border-red-500/40 text-red-300"
            : "border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800"
        }
      `}
    >
      {state === "copied" ? (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : state === "error" ? (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Failed
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy Summary
        </>
      )}
    </button>
  );
}
