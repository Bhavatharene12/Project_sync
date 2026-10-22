import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { getForkStatus, syncForkUpstream } from "../../api/github";

export default function UpstreamSyncPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const currentUrl =
      auditData?.metadata?.html_url ||
      (auditData?.report?.owner && auditData?.report?.repository
        ? `https://github.com/${auditData.report.owner}/${auditData.report.repository}`
        : "");
    if (currentUrl) {
      setRepoUrl(currentUrl);
      checkFork(currentUrl);
    }
  }, [auditData]);

  const checkFork = async (targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await getForkStatus(targetUrl, githubToken);
      setData(res);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("404")) {
        setError("Repository not found or no public access. Please check the URL format.");
      } else {
        setError(msg || "Failed to inspect fork status.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setNotice(null);
    try {
      const res = await syncForkUpstream(repoUrl, data?.default_branch || "main", githubToken);
      setNotice(res.message || "Fork synchronized with upstream successfully!");
      checkFork();
    } catch (err) {
      setError(err.message || "Failed to synchronize fork.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔄</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Upstream Fork Synchronizer</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                1-Click Fast-Forward
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Keep your fork in sync with upstream changes made by teammates or open-source maintainers without complex terminal git remote commands.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] lg:w-96">
              <input
                type="text"
                placeholder="e.g. your-username/react-fork"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkFork()}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-500 font-mono"
              />
            </div>
            <button
              onClick={() => checkFork()}
              disabled={loading || !repoUrl}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Inspect Fork</span>
                </>
              )}
            </button>
          </div>
        </div>

        {notice && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center justify-between">
            <span className="font-medium">✓ {notice}</span>
            <button onClick={() => setNotice(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1">✕</button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {data && (
        <>
          {/* Informational State for Root (Non-Fork) Repositories */}
          {!data.is_fork ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 lg:p-12 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-3xl">
                  🌱
                </div>
                <div>
                  <h3 className="text-lg lg:text-xl font-bold text-white">
                    {data.education?.title || "Standalone Root Repository — Upstream Sync Not Required"}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    {data.education?.explanation ||
                      "This repository is an original root project, not a GitHub fork. Upstream synchronization applies when working on a fork of another repository."}
                  </p>
                </div>
              </div>

              {/* SCM Educational Concept Box */}
              <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  How Upstream Syncing Works in GitHub & SCM
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-white text-sm block">1. Original Upstream</span>
                    <p className="text-slate-400 leading-relaxed">
                      Main repository owned by the organization, professor, or open-source community where core features are merged.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-white text-sm block">2. Personal Fork</span>
                    <p className="text-slate-400 leading-relaxed">
                      Your copy on GitHub where you develop branches. Over time, your fork falls behind commits made upstream.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-blue-400 text-sm block">3. 1-Click Sync</span>
                    <p className="text-slate-400 leading-relaxed">
                      Sync fast-forwards your fork using GitHub's REST API without requiring git remote add or terminal rebase hassles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Fork Divergence & Action Deck */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
              {/* Divergence Diagram */}
              <div className="flex flex-col lg:flex-row items-center justify-between p-6 bg-slate-950/80 rounded-2xl border border-slate-800 gap-6">
                <div className="text-center lg:text-left">
                  <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Upstream Parent</span>
                  <p className="text-lg font-bold text-white mt-1">{data.upstream?.full_name}</p>
                  <span className="text-xs font-mono text-slate-400">branch: {data.upstream?.default_branch}</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full font-mono font-bold">
                      {data.sync_status?.behind_by} behind
                    </span>
                    <span className="text-slate-500 text-lg">⇄</span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono font-bold">
                      {data.sync_status?.ahead_by} ahead
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-2 font-medium">State: {data.sync_status?.status}</span>
                </div>

                <div className="text-center lg:text-right">
                  <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Your Fork</span>
                  <p className="text-lg font-bold text-blue-400 mt-1">{data.repository}</p>
                  <span className="text-xs font-mono text-slate-400">branch: {data.default_branch}</span>
                </div>
              </div>

              {/* Action Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {data.sync_status?.is_up_to_date ? "Fork is Fully Synchronized ✓" : "Divergence Detected"}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xl">
                    {data.sync_status?.is_up_to_date
                      ? "Your fork has all the latest commits from the upstream parent repository."
                      : `Your branch is missing ${data.sync_status?.behind_by} commits from upstream. Click below to fast-forward merge.`}
                  </p>
                </div>

                <button
                  onClick={handleSync}
                  disabled={syncing || data.sync_status?.is_up_to_date}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-3 rounded-xl transition shrink-0 shadow-lg shadow-blue-600/20"
                >
                  {syncing ? "Synchronizing..." : "⚡ Fast-Forward Merge Upstream"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
