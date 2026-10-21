import { useNavigate } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";

function QuickActions() {
  const navigate = useNavigate();
  const { auditData, openToolModal, setError } = useSCM();

  const handleBranchAnalysis = () => {
    if (!auditData) {
      setError("Please scan a repository first to analyze its branch structure.");
      navigate("/repository-scan");
      return;
    }
    openToolModal("BRANCH");
  };

  const handleReadmeAction = () => {
    if (!auditData) {
      setError("Please scan a repository first to evaluate and generate README documentation.");
      navigate("/repository-scan");
      return;
    }
    openToolModal("README");
  };

  const handleReleaseNotesAction = () => {
    if (!auditData) {
      setError("Please scan a repository first to compile release notes from commits and tags.");
      navigate("/repository-scan");
      return;
    }
    openToolModal("RELEASE");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚡</span> Quick SCM Actions
          </h2>
          <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            Automated Tools
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Trigger automated SCM tasks, documentation generation, and release synthesis with one click.
        </p>

        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => navigate("/repository-scan")}
            className="flex flex-col items-start p-4 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-white transition group text-left"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔍</span>
            <span className="font-semibold text-sm text-blue-300">Scan Repository</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Audit any public GitHub repo</span>
          </button>

          <button
            onClick={handleReadmeAction}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition group text-left"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📄</span>
            <span className="font-semibold text-sm text-emerald-300">Generate README</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Scaffold missing sections</span>
          </button>

          <button
            onClick={handleBranchAnalysis}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition group text-left"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🌿</span>
            <span className="font-semibold text-sm text-amber-300">Branch Strategy</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Lifecycle model & diagram</span>
          </button>

          <button
            onClick={handleReleaseNotesAction}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition group text-left"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🏷️</span>
            <span className="font-semibold text-sm text-purple-300">Release Plan</span>
            <span className="text-[11px] text-slate-400 mt-0.5">SemVer notes & checklist</span>
          </button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={() => navigate("/automation")}
          className="text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1"
        >
          <span>Open Full Action Center →</span>
        </button>
        <span className="text-slate-400 font-mono">v2.5</span>
      </div>
    </div>
  );
}

export default QuickActions;