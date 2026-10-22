import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { getWorkspaceTriage, deleteBranchSafe } from "../../api/github";

export default function WorkspacePage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  useEffect(() => {
    const currentUrl =
      auditData?.metadata?.html_url ||
      (auditData?.report?.owner && auditData?.report?.repository
        ? `https://github.com/${auditData.report.owner}/${auditData.report.repository}`
        : "");
    if (currentUrl) {
      setRepoUrl(currentUrl);
      loadTriage(currentUrl);
    }
  }, [auditData]);

  const loadTriage = async (targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    setActionNotice(null);
    try {
      const res = await getWorkspaceTriage(targetUrl, githubToken);
      setData(res);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setError("Repository not found or no public access. Please check the URL format (owner/repo).");
      } else {
        setError(msg || "Failed to load workspace triage items.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePruneBranch = async (branchName) => {
    if (!window.confirm(`Are you sure you want to prune stale branch '${branchName}'?`)) return;
    try {
      await deleteBranchSafe(repoUrl, branchName, false, githubToken);
      setActionNotice(`Branch '${branchName}' pruned successfully.`);
      loadTriage();
    } catch (err) {
      alert(err.message || "Failed to prune branch.");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Today's Workspace</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                SCM Command Deck
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Your daily engineering triage: pull requests awaiting review, failing CI runs, ready-to-merge work, and branch health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] lg:w-96">
              <input
                type="text"
                placeholder="owner/repo or full GitHub URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadTriage()}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-500 font-mono"
              />
            </div>
            <button
              onClick={() => loadTriage()}
              disabled={loading || !repoUrl}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Refresh Workspace</span>
                </>
              )}
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center justify-between">
            <span className="font-medium">✓ {actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1">✕</button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Ready to Merge</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">Approved</span>
            </div>
            <p className="text-3xl lg:text-4xl font-black text-emerald-400 mt-3">{data.summary.ready_to_merge_count}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Passed all checks & reviews</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Broken CI Runs</span>
              <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold border border-rose-500/20">Attention</span>
            </div>
            <p className="text-3xl lg:text-4xl font-black text-rose-400 mt-3">{data.summary.broken_ci_count}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Failing GitHub Actions</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Awaiting Review</span>
              <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold border border-amber-500/20">Open PRs</span>
            </div>
            <p className="text-3xl lg:text-4xl font-black text-amber-400 mt-3">{data.summary.needs_review_count}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Pending team feedback</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Stale Branches</span>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/20">&gt; 7 days</span>
            </div>
            <p className="text-3xl lg:text-4xl font-black text-indigo-400 mt-3">{data.summary.stale_branch_count}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Candidates for pruning</p>
          </div>
        </div>
      )}

      {/* Main Content Sections: When there are items */}
      {data && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left 2 Columns: Priority Action Queues */}
          <div className="xl:col-span-2 space-y-6">
            {/* Section 1: Ready to Merge */}
            {data.ready_to_merge.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h2 className="text-base font-bold text-white">Ready to Merge</h2>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">
                      {data.ready_to_merge.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.ready_to_merge.map((pr) => (
                    <div
                      key={pr.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-xs">#{pr.number}</span>
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-white hover:text-blue-400 transition"
                          >
                            {pr.title}
                          </a>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          by <strong className="text-slate-300">@{pr.author}</strong> • branch <code className="text-blue-300">{pr.branch}</code>
                        </p>
                      </div>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shrink-0 text-center"
                      >
                        Inspect & Merge →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Broken CI Runs */}
            {data.broken_ci.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <h2 className="text-base font-bold text-white">Broken CI / Action Failures</h2>
                    <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold border border-rose-500/20">
                      {data.broken_ci.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.broken_ci.map((ci) => (
                    <div
                      key={ci.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-400 font-semibold text-xs">✕ Failure</span>
                          <a
                            href={ci.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-white hover:text-blue-400 transition"
                          >
                            {ci.name}
                          </a>
                          <span className="text-xs font-mono text-slate-400">({ci.branch})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Commit: "{ci.commit_message}" • Triggered by @{ci.actor}
                        </p>
                      </div>
                      <a
                        href={ci.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0 text-center"
                      >
                        View Error Logs →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Open PRs Needing Review */}
            {data.needs_review.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <h2 className="text-base font-bold text-white">Open Pull Requests Awaiting Review</h2>
                    <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold border border-amber-500/20">
                      {data.needs_review.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.needs_review.map((pr) => (
                    <div
                      key={pr.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-xs">#{pr.number}</span>
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-white hover:text-blue-400 transition"
                          >
                            {pr.title}
                          </a>
                          {pr.draft && (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          by @{pr.author} • {pr.changes_requested ? "Changes requested" : "Needs review"}
                        </p>
                      </div>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0 text-center border border-slate-700"
                      >
                        Review PR →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zero Blocking Queue Card: When 0 items */}
            {data.summary.total_action_items === 0 && (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
                <span className="text-4xl">🎉</span>
                <h3 className="text-xl font-bold text-white">Repository Healthy & Zero Blocking Items</h3>
                <p className="text-slate-400 text-sm max-w-lg mx-auto">
                  All active pull requests are reviewed, continuous integration workflows are passing, and branch hygiene is disciplined.
                </p>
              </div>
            )}

            {/* Section 4: Stale Branches */}
            {data.stale_branches.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                    <h2 className="text-base font-bold text-white">Stale Branches Inactive &gt; 7 Days</h2>
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/20">
                      {data.stale_branches.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.stale_branches.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-4 bg-slate-950/70 border border-slate-800 rounded-xl"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-bold text-indigo-300">{b.name}</code>
                          <span className="text-xs font-mono text-slate-500">({b.sha})</span>
                          <span className="text-xs text-amber-400 font-semibold">{b.age_days}d inactive</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Author: {b.author}</p>
                      </div>
                      <button
                        onClick={() => handlePruneBranch(b.name)}
                        className="bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                      >
                        Prune Branch
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Repository Health & Activity Baseline */}
          <div className="space-y-6">
            {/* Repository Info Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repository Snapshot</span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {data.default_branch}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-bold text-white">{data.repository}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{data.repo_meta?.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Total Branches</span>
                  <span className="text-base font-bold text-white mt-0.5 block">{data.summary.total_branches}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Open Issues</span>
                  <span className="text-base font-bold text-white mt-0.5 block">{data.summary.open_issues_count}</span>
                </div>
              </div>

              {data.latest_release && (
                <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Latest Release</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-white">{data.latest_release.tag_name}</span>
                    <a
                      href={data.latest_release.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-purple-400 hover:underline"
                    >
                      Release notes →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity Feed */}
            {data.recent_commits && data.recent_commits.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Repository Commits</span>
                  <span className="text-xs text-slate-400">{data.recent_commits.length} tracked</span>
                </div>

                <div className="space-y-3">
                  {data.recent_commits.map((c) => (
                    <div key={c.sha} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 truncate pr-2">{c.message}</span>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-blue-400 hover:underline shrink-0"
                        >
                          {c.sha}
                        </a>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>by @{c.author}</span>
                        <span>{c.date ? new Date(c.date).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
