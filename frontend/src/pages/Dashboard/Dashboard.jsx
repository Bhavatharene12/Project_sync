import { useNavigate } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";
import StatCard from "../../components/ui/StatCard";
import RepositoryDoctor from "../../components/ui/RepositoryDoctor";
import QuickActions from "../../components/ui/QuickActions";
import SCMMaturityDashboard from "../../components/ui/SCMMaturityDashboard";

function Dashboard() {
  const navigate = useNavigate();
  const { auditData } = useSCM();

  const isScanned = Boolean(auditData);

  const repoName = auditData?.metadata?.name || auditData?.report?.repository;
  const owner = auditData?.metadata?.owner?.login || auditData?.report?.owner;
  const description = auditData?.metadata?.description;
  const stars = auditData?.metadata?.stargazers_count ?? "—";
  const branchesCount = auditData?.branches?.total_branches ?? "—";
  const language = auditData?.metadata?.language ?? "—";
  const healthStatus = auditData?.health?.health ?? "—";
  const healthScore = auditData?.health?.score ?? 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Dynamic Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">
              SCM Executive Dashboard
            </h1>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-medium">
              Live
            </span>
          </div>

          <p className="text-slate-400 text-sm mt-1">
            {isScanned
              ? `Currently auditing repository: ${owner}/${repoName}`
              : "No repository scanned yet. Connect or scan a GitHub repository to begin SCM audits."}
          </p>

          {isScanned && description && (
            <p className="text-xs text-slate-500 mt-2 max-w-2xl italic">
              "{description}"
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isScanned ? (
            <button
              onClick={() => navigate("/repository-scan")}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <span>🔄</span>
              <span>Re-scan Repository</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/repository-scan")}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-2 animate-bounce"
            >
              <span>🔍</span>
              <span>Scan Your First Repository</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State Banner if no repository has been scanned yet */}
      {!isScanned && (
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-900/50 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🚀
          </div>
          <h2 className="text-xl font-bold text-white">No repository scanned yet.</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
            Paste any public GitHub repository URL to evaluate documentation completeness, branch hygiene, commit conventions, and release baselines.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/repository-scan")}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
            >
              Go to Repository Scanner →
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Repository Health"
          value={isScanned ? `${healthScore}% (${healthStatus})` : "No data"}
        />
        <StatCard
          title="Active Branches"
          value={isScanned ? `${branchesCount} branches` : "No data"}
        />
        <StatCard
          title="GitHub Stars"
          value={isScanned ? `${stars} ⭐` : "No data"}
        />
        <StatCard
          title="Primary Language"
          value={isScanned ? language : "No data"}
        />
      </div>

      {/* SCM Maturity Radar (Visible when repository scanned) */}
      {isScanned && <SCMMaturityDashboard />}

      {/* Doctor & Quick Actions Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RepositoryDoctor />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;