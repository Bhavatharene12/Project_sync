import { useState } from "react";
import { useSCM } from "../../context/SCMContext";

import RepositoryInfoCard from "../../components/ui/RepositoryInfoCard";
import HealthCard from "../../components/ui/HealthCard";
import ReadmeCard from "../../components/ui/ReadmeCard";
import BranchCard from "../../components/ui/BranchCard";

import CommitCard from "../../components/ui/CommitCard";
import ReleaseCard from "../../components/ui/ReleaseCard";
import WorkflowCard from "../../components/ui/WorkflowCard";
import SCMProblemsCard from "../../components/ui/SCMProblemsCard";
import SCMRecommendationsCard from "../../components/ui/SCMRecommendationsCard";
import SCMTasksCard from "../../components/ui/SCMTasksCard";

function RepositoryScan() {
  const {
    auditData,
    legacyScanData,
    performScan,
    loading,
    loadingStage,
    setError,
    clearScannedData
  } = useSCM();

  const [inputUrl, setInputUrl] = useState(() => {
    if (auditData?.metadata?.owner?.login && auditData?.metadata?.name) {
      return `https://github.com/${auditData.metadata.owner.login}/${auditData.metadata.name}`;
    }
    return "";
  });

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setError("Please enter a GitHub repository URL or 'owner/repo' format.");
      return;
    }
    await performScan(inputUrl.trim());
  };

  const sampleRepositories = [
    "octocat/Hello-World",
    "pallets/flask",
    "fastapi/fastapi",
    "facebook/react",
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Repository Scanner & SCM Audit
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Scan any public GitHub repository to execute automated Software Configuration Management checks.
        </p>
      </div>

      {/* Input Form & Quick Samples */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleScanSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base">
                🔗
              </span>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                disabled={loading}
                placeholder="https://github.com/owner/repository, github.com/owner/repo, or owner/repo"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition disabled:opacity-50 text-sm font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Scan Repository</span>
                </>
              )}
            </button>
          </div>

          {/* Sample Repositories Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-500 font-medium">Quick Examples:</span>
            {sampleRepositories.map((sample) => (
              <button
                key={sample}
                type="button"
                disabled={loading}
                onClick={() => {
                  setInputUrl(sample);
                  performScan(sample);
                }}
                className="text-xs font-mono bg-slate-800 hover:bg-slate-750 text-blue-400 border border-slate-700 px-2.5 py-1 rounded-md transition"
              >
                {sample}
              </button>
            ))}
          </div>
        </form>

        {/* Loading Experience with animated multi-stage feedback */}
        {loading && (
          <div className="mt-6 p-6 bg-slate-950/80 rounded-xl border border-blue-900/60 flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
            </div>
            <div>
              <p className="text-base font-semibold text-white animate-pulse">
                {loadingStage}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Auditing GitHub REST endpoints, calculating health, and diagnosing SCM rules...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scanned Results */}
      {legacyScanData && auditData && !loading && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Row with Clear / Rescan */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>📊</span> Audit Results: <span className="text-blue-400">{legacyScanData.owner}/{legacyScanData.repository}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Default branch: <code className="text-slate-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded">{legacyScanData.default_branch}</code>
              </p>
            </div>
            <button
              onClick={clearScannedData}
              className="text-xs text-slate-400 hover:text-red-400 transition underline"
            >
              Clear Scanned Data
            </button>
          </div>

          {/* Primary Metadata and Health Cards (Original extended) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RepositoryInfoCard repoData={legacyScanData} />
            </div>
            <div>
              <HealthCard
                score={legacyScanData.health_score}
                status={legacyScanData.health_status}
                reasons={legacyScanData.ai_reasons}
              />
            </div>
          </div>

          {/* 3. README and Branch Analysis Cards (Originals) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReadmeCard repoData={legacyScanData} />
            <BranchCard repoData={legacyScanData} />
          </div>

          {/* 4. SCM Extension Cards: Commits, Releases, Workflows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CommitCard commitsAudit={auditData.commits_audit} />
            <ReleaseCard releaseAudit={auditData.release_audit} />
            <WorkflowCard workflowAudit={auditData.workflow_audit} />
          </div>

          {/* 5. Identified SCM Problems Card */}
          <SCMProblemsCard problems={auditData.report?.problems} />

          {/* 6. Prioritized Recommendations Card */}
          <SCMRecommendationsCard recommendations={auditData.report?.recommendations} />

          {/* 7. Actionable Priority Tasks Card */}
          <SCMTasksCard tasks={auditData.report?.available_tasks} />
        </div>
      )}
    </div>
  );
}

export default RepositoryScan;