import { useSCM } from "../../context/SCMContext";

function SCMProblemsCard({ problems = [] }) {
  const { openToolModal } = useSCM();

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "critical":
        return {
          icon: "❌",
          badge: "bg-red-950/80 text-red-400 border-red-800",
        };
      case "warning":
        return {
          icon: "⚠️",
          badge: "bg-amber-950/80 text-amber-400 border-amber-800",
        };
      case "info":
      default:
        return {
          icon: "ℹ️",
          badge: "bg-blue-950/80 text-blue-400 border-blue-800",
        };
    }
  };

  const getActionForProblem = (problem) => {
    const cat = (problem.category || "").toLowerCase();
    if (cat.includes("doc")) {
      return { label: "✓ Generate Documentation & License", tool: "README" };
    }
    if (cat.includes("rel")) {
      return { label: "✓ Create Release Plan", tool: "RELEASE" };
    }
    if (cat.includes("branch")) {
      return { label: "✓ Generate Branch Plan", tool: "BRANCH" };
    }
    if (cat.includes("ci")) {
      return { label: "✓ Generate CI Pipeline", tool: "WORKFLOW" };
    }
    if (cat.includes("commit")) {
      return { label: "✓ Rewrite Commits", tool: "COMMIT" };
    }
    return { label: "✓ Run Fix", tool: "IMPACT" };
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🚩</span> Identified SCM Problems ({problems.length})
        </h2>
        <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md border border-slate-700">
          Automated Detection
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Deviations from standard source configuration management, documentation, and branching conventions.
      </p>

      {problems.length === 0 ? (
        <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
          <span className="text-3xl inline-block mb-2">🎉</span>
          <p className="text-sm font-semibold text-emerald-400">Zero Critical SCM Problems Detected</p>
          <p className="text-xs text-slate-400 mt-1">This repository adheres to standard SCM hygiene guidelines.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((p) => {
            const style = getSeverityStyle(p.severity);
            const action = getActionForProblem(p);
            return (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-base mt-0.5">{style.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{p.title}</h4>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p.category}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${style.badge}`}>
                        {p.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => openToolModal(action.tool)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition whitespace-nowrap shrink-0 self-end sm:self-auto shadow-md shadow-blue-600/20"
                >
                  {action.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SCMProblemsCard;
