import { useSCM } from "../../context/SCMContext";

function SCMRecommendationsCard({ recommendations = [] }) {
  const { openToolModal } = useSCM();

  const getToolForRec = (rec) => {
    const id = rec.id || "";
    if (id.includes("DOC")) return "README";
    if (id.includes("BR")) return "BRANCH";
    if (id.includes("REL")) return "RELEASE";
    if (id.includes("CI")) return "WORKFLOW";
    if (id.includes("CMT")) return "COMMIT";
    return "IMPACT";
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>💡</span> Prioritized SCM Recommendations ({recommendations.length})
        </h2>
        <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md border border-slate-700">
          Actionable Fixes
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Step-by-step remediation advice to resolve identified configuration issues.
      </p>

      {recommendations.length === 0 ? (
        <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
          <p className="text-sm font-semibold text-emerald-400">All configurations optimal</p>
          <p className="text-xs text-slate-400 mt-1">No pending remediation required.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const toolType = getToolForRec(rec);
            return (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                        {rec.id}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 font-medium">
                      <strong className="text-slate-400">Action: </strong>
                      {rec.action}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      <strong className="text-slate-500">Rationale: </strong>
                      {rec.rationale}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {rec.automated ? (
                      <button
                        onClick={() => openToolModal(toolType)}
                        className="text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1 shadow-md shadow-emerald-950/40"
                      >
                        <span>⚡</span>
                        <span>Auto-Fix</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openToolModal(toolType)}
                        className="text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition"
                      >
                        Guidance
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SCMRecommendationsCard;
