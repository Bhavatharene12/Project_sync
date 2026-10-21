import { useState } from "react";
import { useSCM } from "../../context/SCMContext";
import { useNavigate } from "react-router-dom";

function GitHubConnectionPage() {
  const {
    githubToken,
    connectionInfo,
    connectionLoading,
    connectToken,
    disconnectToken,
    switchActiveRepository,
    error,
    setError
  } = useSCM();

  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState(githubToken || "");
  const [showToken, setShowToken] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleConnect = async (e) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    const info = await connectToken(tokenInput);
    if (info?.authenticated) {
      setFeedback(`Connected as @${info.user.login}. Authorized with ${info.scopes.length} scopes.`);
    } else {
      setError(info?.message || "Token verification failed. Please check the token format and permissions.");
    }
  };

  const handleDisconnect = () => {
    disconnectToken();
    setTokenInput("");
    setFeedback("Disconnected GitHub Personal Access Token.");
  };

  const handleSelectRepo = async (fullName) => {
    await switchActiveRepository(fullName);
    navigate("/");
  };

  const user = connectionInfo?.user;
  const rateLimit = connectionInfo?.rate_limit || { limit: 60, remaining: 60, used: 0 };
  const percentRemaining = Math.max(0, Math.min(100, Math.round((rateLimit.remaining / rateLimit.limit) * 100)));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔑</span>
              <h1 className="text-xl font-bold text-white tracking-wide">
                GitHub Connection & Access Control
              </h1>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Connect your GitHub Personal Access Token (PAT) to enable write operations, live branch management, real README commits, and pull request merges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              connectionInfo?.authenticated
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}>
              {connectionInfo?.authenticated ? "● Connected (Live Write API)" : "○ Local / Read-only Mode"}
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>✓ {feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
        </div>
      )}

      {/* Connection Form & Rate Limits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Management Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            GitHub Personal Access Token (Classic or Fine-Grained)
          </h2>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Personal Access Token (PAT)
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 text-xs"
                >
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Required Scopes for full SCM operations: <code className="text-blue-400">repo</code> (Code, Commits, PRs), <code className="text-blue-400">workflow</code> (GitHub Actions), and <code className="text-blue-400">read:user</code>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={connectionLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {connectionLoading ? "Validating..." : connectionInfo?.authenticated ? "Re-validate & Sync" : "Connect & Validate"}
              </button>

              {connectionInfo?.authenticated && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs px-4 py-2.5 rounded-xl transition"
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>

          {/* User Profile Overview */}
          {user && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center gap-4">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-12 h-12 rounded-full border border-slate-700 object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-sm">{user.name || user.login}</h3>
                  <span className="text-xs text-slate-400 font-mono">@{user.login}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Public Repos: <strong className="text-white">{user.public_repos}</strong></span>
                  <span>•</span>
                  <span>Plan: <strong className="text-blue-400 uppercase">{user.plan || "Free"}</strong></span>
                  <span>•</span>
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    GitHub Profile ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rate Limits & Permissions Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              API Rate Limit Status
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Remaining Requests</span>
                  <span className="font-mono font-bold text-white">
                    {rateLimit.remaining} / {rateLimit.limit}
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentRemaining > 30 ? "bg-emerald-500" : percentRemaining > 10 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${percentRemaining}%` }}
                  ></div>
                </div>
              </div>

              {rateLimit.reset_time && (
                <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span>Reset scheduled at: </span>
                  <strong className="text-white font-mono block mt-0.5">{rateLimit.reset_time}</strong>
                </div>
              )}

              <div className="text-[11px] text-slate-400 leading-relaxed">
                {connectionInfo?.authenticated
                  ? "✓ Authenticated with GitHub PAT (5,000 requests/hour enabled)."
                  : "ℹ Unauthenticated mode limit is 60 requests/hour per IP. Connect a PAT to unlock 5,000 req/hr."}
              </div>
            </div>
          </div>

          {/* Scopes Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Token Permissions
            </h2>

            {connectionInfo?.scopes && connectionInfo.scopes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {connectionInfo.scopes.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                {connectionInfo?.authenticated ? "No specific scopes reported (public token)" : "No token connected"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Accessible Repositories List */}
      {connectionInfo?.repositories && connectionInfo.repositories.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Available Repositories ({connectionInfo.repositories.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any repository to switch active focus in Sync and execute SCM operations.
              </p>
            </div>
            <button
              onClick={() => navigate("/repositories")}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Open Repository Manager →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {connectionInfo.repositories.slice(0, 9).map((r, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-xs font-mono truncate" title={r.full_name}>
                      {r.name}
                    </strong>
                    {r.private && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/20">
                        Private
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 line-clamp-1">
                    {r.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>★ {r.stars}</span>
                    <span>🌿 {r.default_branch}</span>
                  </div>
                  <button
                    onClick={() => handleSelectRepo(r.full_name)}
                    className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition font-medium"
                  >
                    Select & Scan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GitHubConnectionPage;
