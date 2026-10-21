import { useNavigate } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";
import SCMMaturityDashboard from "../../components/ui/SCMMaturityDashboard";
import CommitCard from "../../components/ui/CommitCard";
import ReleaseCard from "../../components/ui/ReleaseCard";
import WorkflowCard from "../../components/ui/WorkflowCard";

function IntelligencePage() {
  const navigate = useNavigate();
  const { auditData, openToolModal } = useSCM();

  const isScanned = Boolean(auditData);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>🧠</span> Repository Intelligence & Maturity
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deep statistical metrics across commit conventions, semantic release baselines, and CI/CD pipelines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {isScanned && (
            <>
              <button
                onClick={() => openToolModal("IMPACT")}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
              >
                <span>🎯</span>
                <span>Impact Analysis</span>
              </button>
              <button
                onClick={() => openToolModal("REPORT")}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
              >
                <span>📝</span>
                <span>Export SCM Report</span>
              </button>
            </>
          )}
          <button
            onClick={() => navigate("/repository-scan")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
          >
            {isScanned ? "Re-scan Repository" : "Scan Repository"}
          </button>
        </div>
      </div>

      {!isScanned ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <span className="text-5xl block mb-3">🧠</span>
          <h3 className="text-lg font-bold text-white">No Intelligence Data Loaded</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Scan a repository to generate composite SCM maturity scores and analyze commit/release velocity.
          </p>
          <button
            onClick={() => navigate("/repository-scan")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
          >
            Go to Scanner →
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <SCMMaturityDashboard />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CommitCard commitsAudit={auditData.commits_audit} />
            <ReleaseCard releaseAudit={auditData.release_audit} />
            <WorkflowCard workflowAudit={auditData.workflow_audit} />
          </div>
        </div>
      )}
    </div>
  );
}

export default IntelligencePage;
