import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { auditBranchesSafety, deleteBranchSafe } from "../../api/github";

export default function BranchCleanerPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const currentUrl =
      auditData?.metadata?.html_url ||
      (auditData?.report?.owner && auditData?.report?.repository
        ? `https://github.com/${auditData.report.owner}/${auditData.report.repository}`
        : "");
    if (currentUrl) {
      setRepoUrl(currentUrl);
      loadBranches(currentUrl);
    }
  }, [auditData]);

  const loadBranches = async (targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await auditBranchesSafety(targetUrl, githubToken);
      setData(res);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("404")) {
        setError("Repository not found or no public access. Please check the URL format.");
      } else {
        setError(msg || "Failed to audit repository branches.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchName, force = false) => {
    if (!window.confirm(`Delete branch '${branchName}' from GitHub?`)) return;
    setDeleting(branchName);
    setNotice(null);
    setError(null);
    try {
      await deleteBranchSafe(repoUrl, branchName, force, githubToken);
      setNotice(`Branch '${branchName}' deleted successfully from GitHub.`);
      loadBranches();
    } catch (err) {
      setError(err.message || `Failed to delete branch '${branchName}'.`);
    } finally {
      setDeleting(null);
    }
  };

  const handleBatchDeleteSafe = async () => {
    if (!data?.safe_to_delete?.length) return;
    if (!window.confirm(`Prune all ${data.safe_to_delete.length} fully merged branches?`)) return;
    setLoading(true);
    let successCount = 0;
    for (const b of data.safe_to_delete) {
      try {
        await deleteBranchSafe(repoUrl, b.name, false, githubToken);
        successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    setNotice(`Pruned ${successCount} merged branches cleanly.`);
    loadBranches();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌿</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Safe Branch Cleaner</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Zero Anxiety Pruning
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Eliminate branch clutter with complete confidence. Uses GitHub Compare API to verify exact divergence (ahead_by == 0) before pruning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] lg:w-96">
              <input
                type="text"
                placeholder="owner/repo or full GitHub URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadBranches()}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              onClick={() => loadBranches()}
              disabled={loading || !repoUrl}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? "Auditing..." : "Audit Branches"}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Safe to Delete</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Fully Merged
                </span>
              </div>
              <p className="text-4xl font-black text-emerald-400 mt-3">{data.safe_to_delete_count}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">0 commits ahead of {data.default_branch}</p>
              {data.safe_to_delete_count > 0 && (
                <button
                  onClick={handleBatchDeleteSafe}
                  className="mt-5 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  ⚡ Batch Prune All Merged Branches
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Active Work</span>
                <span className="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Do Not Delete
                </span>
              </div>
              <p className="text-4xl font-black text-amber-400 mt-3">{data.active_branches_count}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Has unmerged commits in progress</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Protected Branches</span>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Locked
                </span>
              </div>
              <p className="text-4xl font-black text-indigo-400 mt-3">{data.protected_branches_count}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Default and protected release lines</p>
            </div>
          </div>

          {/* Section 1: Merged Branches */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Fully Merged Branches (100% Safe to Prune)</span>
            </h3>
            {data.safe_to_delete.length === 0 ? (
              <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                No merged stale branches detected. Your repository branch tree is tidy!
              </div>
            ) : (
              <div className="space-y-3">
                {data.safe_to_delete.map((b) => (
                  <div
                    key={b.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-bold text-white">{b.name}</code>
                        <span className="text-xs font-mono text-slate-500">({b.sha})</span>
                      </div>
                      <p className="text-xs text-emerald-400/90 mt-1">{b.reason}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(b.name, false)}
                      disabled={deleting === b.name}
                      className="bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 hover:border-rose-500/30 transition shrink-0"
                    >
                      {deleting === b.name ? "Deleting..." : "Delete Branch"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Active / Unmerged Branches */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Active & Unmerged Branches (Protected from Accidental Deletion)</span>
            </h3>
            <div className="space-y-3">
              {data.active_branches.map((b) => (
                <div
                  key={b.name}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-bold text-amber-200">{b.name}</code>
                      <span className="text-xs font-mono text-slate-500">({b.sha})</span>
                      <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold font-mono">
                        {b.ahead_by} commit{b.ahead_by > 1 ? "s" : ""} ahead
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Contains work not yet in {b.base_branch}. Protected by Sync safety guard.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 italic font-medium">Protected by Sync</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
