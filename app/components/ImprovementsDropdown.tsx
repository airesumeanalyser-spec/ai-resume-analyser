import React, { useMemo, useState } from "react";

// Types mirror pieces of Feedback without importing global types
interface ProblemItem {
  snippet: string;
  reason: string;
  suggestion: string;
  severity?: "low" | "med" | "high";
  page?: number;
  line?: number;
  sectionGuess?: string;
  source?: string;
}

interface ImprovementsDropdownProps {
  feedback: any; // using any to avoid tight coupling with global type
}

const severityColor = (sev?: string) =>
  sev === "high"
    ? "bg-orange-200"
    : sev === "med"
    ? "bg-yellow-200"
    : "bg-yellow-100";

const ImprovementsDropdown: React.FC<ImprovementsDropdownProps> = ({ feedback }) => {
  const [open, setOpen] = useState<boolean>(false);

  const allProblems: ProblemItem[] = useMemo(() => {
    if (!feedback) return [];
    const collect = (cat?: any) => (cat?.problems as ProblemItem[] | undefined) ?? [];
    const list = [
      ...collect(feedback.toneAndStyle),
      ...collect(feedback.content),
      ...collect(feedback.structure ?? (feedback as any)?.strucutre),
      ...collect(feedback.skills),
    ];
    // De-duplicate by snippet+reason
    const seen = new Set<string>();
    const unique: ProblemItem[] = [];
    for (const p of list) {
      const key = `${p.snippet}|${p.reason}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    return unique;
  }, [feedback]);

  // Filter to show only Medium and High severity
  const filtered = useMemo(() => {
    return allProblems.filter(p => {
      const severity = p.severity ?? "low";
      return severity === "med" || severity === "high";
    });
  }, [allProblems]);

  if (!filtered.length) return null;

  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Suggested Improvements</h3>
          <p className="text-sm text-gray-500">Medium to High priority items mapped to JD alignment and ATS best practices.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          {open ? "Hide" : "Show"} ({filtered.length})
        </button>
      </div>

      {open && (
        <div className="mt-3">
          <ul className="space-y-3">
            {filtered.map((p, idx) => (
              <li key={idx} className="rounded-md border border-gray-200 p-3 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px]">
                    <span className={`px-1 py-0.5 rounded-sm font-medium text-gray-900 ${severityColor(p.severity)}`}>
                      {p.snippet}
                    </span>
                    {(p.sectionGuess || p.page || p.line) && (
                      <span className="ml-2 text-xs text-gray-600">
                        {p.sectionGuess ? `· ${p.sectionGuess}` : ""}
                        {p.page ? ` · p.${p.page}` : ""}
                        {p.line ? ` · line ${p.line}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.source && (
                      <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${p.source === "JD" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {p.source}
                      </span>
                    )}
                    {p.severity && (
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">{p.severity}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-1"><span className="font-semibold">Why:</span> {p.reason}</p>
                <p className="text-xs text-gray-800 mt-1"><span className="font-semibold">Suggestion:</span> {p.suggestion}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImprovementsDropdown;
