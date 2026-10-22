import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";

const TITLE_MAP = {
  "/": "Today's Workspace",
  "/workspace": "Today's  Workspace",
  "/risk-analyzer": "Repository Risk Analyzer & SCM Health",
  "/release-readiness": "Release Readiness Checker",
  "/conflict-predictor": "Merge Conflict Predictor",
  "/team-sync": "Team Change Log & Standup Digest",
  "/essentials": "Missing Essentials",
  "/commit-builder": "Smart Commit Assistant",
  "/contributions": "Contribution Doctor",
  "/branch-cleaner": "Safe Branch Cleaner",
  "/upstream-sync": "Upstream Fork Synchronizer",
  "/project-review": "Project SCM Review Generator",
  "/github": "GitHub Settings & PAT",
};

function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { auditData, performScan, loading, connectionInfo } = useSCM();
  const [quickSearch, setQuickSearch] = useState("");

  const title = TITLE_MAP[location.pathname] || "SCM Assistant";
  const repoName = auditData?.metadata?.name;
  const owner = auditData?.metadata?.owner?.login;

  const handleQuickScan = async (e) => {
    if (e.key === "Enter" && quickSearch.trim()) {
      navigate("/repository-scan");
      await performScan(quickSearch.trim());
      setQuickSearch("");
    }
  };

  const user = connectionInfo?.user;
  const rateLimit = connectionInfo?.rate_limit;

  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
      <div className="flex items-center gap-4">
        <h2 className="text-white text-lg font-semibold tracking-wide">
          {title}
        </h2>
        {repoName && (
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 hidden sm:inline-block">
            Target: <strong className="text-blue-400">{owner}/{repoName}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            onKeyDown={handleQuickScan}
            disabled={loading}
            placeholder={loading ? "Scanning repository..." : "Quick scan (e.g. owner/repo) ↵"}
            className="bg-slate-800 text-white placeholder-slate-500 text-xs px-3.5 py-2 rounded-lg outline-none w-56 border border-slate-700 focus:border-blue-500 transition disabled:opacity-50"
          />
        </div>

        <button
          onClick={() => navigate("/workspace")}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
        >
          <span>⚡</span>
          <span className="hidden md:inline">Workspace</span>
        </button>

        <button
          onClick={() => navigate("/essentials")}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
        >
          <span>📦</span>
          <span className="hidden md:inline">Essentials</span>
        </button>

        {/* GitHub Connection Indicator Pill */}
        {connectionInfo?.authenticated && user ? (
          <button
            onClick={() => navigate("/github")}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-2.5 py-1.5 rounded-lg transition"
            title={`Connected as @${user.login} (${rateLimit?.remaining || 0} API calls remaining)`}
          >
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-5 h-5 rounded-full object-cover border border-slate-600"
            />
            <span className="text-xs text-white font-medium hidden sm:inline">@{user.login}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        ) : (
          <button
            onClick={() => navigate("/github")}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <span>🔑</span>
            <span className="hidden sm:inline">Connect PAT</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Topbar;