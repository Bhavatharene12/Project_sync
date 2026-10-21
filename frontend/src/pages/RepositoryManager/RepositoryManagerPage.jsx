import { useState } from "react";
import { useSCM } from "../../context/SCMContext";
import { useNavigate } from "react-router-dom";

function RepositoryManagerPage() {
  const {
    connectionInfo,
    auditData,
    switchActiveRepository,
    loading
  } = useSCM();

  const navigate = useNavigate();
  const [filterQuery, setFilterQuery] = useState("");
  const [manualInput, setManualInput] = useState("");

  const activeFullName = auditData ? `${auditData.metadata?.owner?.login}/${auditData.metadata?.name}` : null;
  const repos = connectionInfo?.repositories || [];

  const filteredRepos = repos.filter(r =>
    r.name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.full_name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSelect = async (slug) => {
    await switchActiveRepository(slug);
    navigate("/");
  };

  const handleManualScan = async (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      await switchActiveRepository(manualInput.trim());
      setManualInput("");
      navigate("/");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Repository Manager & Switcher
              </h1>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Browse your authenticated GitHub repositories or enter any public repository to switch focus and execute SCM operations.
            </p>
          </div>

          {activeFullName && (
            <div className="bg-blue-600/10 border border-blue-500/30 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">Active:</span>
              <strong className="text-blue-400 font-mono">{activeFullName}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Manual Enter Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Connect / Scan Any Repository
        </h2>
        <form onSubmit={handleManualScan} className="flex gap-3">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="e.g. facebook/react, vercel/next.js, or https://github.com/owner/repo"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !manualInput.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Switch & Audit"}
          </button>
        </form>
      </div>

      {/* Repository Filter & Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Your Accessible Repositories ({filteredRepos.length})
          </h2>

          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter repositories..."
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-lg text-white placeholder-slate-500 outline-none focus:border-blue-500 w-64"
          />
        </div>

        {filteredRepos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.map((repo, idx) => {
              const isActive = activeFullName?.toLowerCase() === repo.full_name?.toLowerCase();

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                    isActive
                      ? "bg-blue-950/20 border-blue-500/60 shadow-lg shadow-blue-500/10"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-white truncate" title={repo.full_name}>
                        {repo.full_name}
                      </span>
                      {repo.private ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Private
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          Public
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">
                      {repo.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>★ {repo.stars}</span>
                      <span>🔱 {repo.forks}</span>
                      <span>🌿 {repo.default_branch}</span>
                    </div>

                    {isActive ? (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold px-2.5 py-1 rounded-lg">
                        Active Repo
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSelect(repo.full_name)}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1 rounded-lg transition"
                      >
                        Select & Scan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs italic">
            {connectionInfo?.authenticated
              ? "No repositories match your filter query."
              : "No token connected yet. Connect your GitHub token on the GitHub connection page to see your private and organization repositories."}
          </div>
        )}
      </div>
    </div>
  );
}

export default RepositoryManagerPage;
