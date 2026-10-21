import { useNavigate } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";
import BranchCard from "../../components/ui/BranchCard";

function BranchManagerPage() {
  const navigate = useNavigate();
  const { auditData, legacyScanData, openToolModal } = useSCM();

  const isScanned = Boolean(auditData);
  const branches = auditData?.branches || {};
  const branchAudit = auditData?.branch_audit || {};
  const defaultBranch = auditData?.metadata?.default_branch || "main";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>🌿</span> Branch Manager & Hygiene
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Audit branch naming conventions, default branch configuration, and feature branch isolation.
          </p>
        </div>
        <div className="flex gap-3">
          {isScanned && (
            <button
              onClick={() => openToolModal("BRANCH")}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
            >
              <span>🌿</span>
              <span>Generate Branch Strategy</span>
            </button>
          )}
          <button
            onClick={() => navigate("/repository-scan")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
          >
            {isScanned ? "Scan Another Repo" : "Scan Repository"}
          </button>
        </div>
      </div>

      {!isScanned ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <span className="text-5xl block mb-3">🌿</span>
          <h3 className="text-lg font-bold text-white">No Branch Data Available</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Please scan a GitHub repository to inspect its branch strategy, feature workstreams, and protection status.
          </p>
          <button
            onClick={() => navigate("/repository-scan")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
          >
            Go to Scanner →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Default Branch</span>
              <span className="text-xl font-mono font-bold text-blue-400 mt-1 block">
                {defaultBranch}
              </span>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Total Branches</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {branches.total_branches || 0}
              </span>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Feature Branches</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {branchAudit.feature_branches_count || 0}
              </span>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Protected Branches</span>
              <span className="text-xl font-bold text-purple-400 mt-1 block">
                {branchAudit.protected_branches_count || 0}
              </span>
            </div>
          </div>

          <BranchCard repoData={legacyScanData} />

          {/* SCM Best Practices Guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white">💡 SCM Branching Guidelines</h3>
              <button
                onClick={() => openToolModal("BRANCH")}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
              >
                View Full Interactive Lifecycle & Diagram →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h4 className="font-semibold text-blue-400 mb-1">1. Feature Isolation</h4>
                <p className="text-slate-400">Keep feature branches short-lived (feat/description). Never commit directly to main.</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h4 className="font-semibold text-emerald-400 mb-1">2. Branch Protection</h4>
                <p className="text-slate-400">Require at least 1 pull request review and passing CI before merging to default branch.</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h4 className="font-semibold text-purple-400 mb-1">3. Automated Pruning</h4>
                <p className="text-slate-400">Enable "Automatically delete head branches" in GitHub repository settings to reduce clutter.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchManagerPage;
