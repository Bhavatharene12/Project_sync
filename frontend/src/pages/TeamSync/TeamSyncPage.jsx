import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { getTeamChangeLog } from "../../api/github";

export default function TeamSyncPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [hours, setHours] = useState(72);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const currentUrl =
      auditData?.metadata?.html_url ||
      (auditData?.report?.owner && auditData?.report?.repository
        ? `https://github.com/${auditData.report.owner}/${auditData.report.repository}`
        : "");
    if (currentUrl) {
      setRepoUrl(currentUrl);
      loadTeamSync(currentUrl, hours);
    }
  }, [auditData]);

  const loadTeamSync = async (targetUrl = repoUrl, targetHours = hours) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getTeamChangeLog(targetUrl, targetHours, githubToken);
      setData(res);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("404")) {
        setError("Repository not found or no public access. Please check the URL format.");
      } else {
        setError(msg || "Failed to load team change log.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyStandup = () => {
    if (!data?.standup_markdown) return;
    navigator.clipboard.writeText(data.standup_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👥</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Team Change Log & Standup Digest</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Collaboration Engine
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Plain-English digest of what your team shipped over the past 24–72 hours, grouped by teammate and ready to export into daily standup updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] lg:w-80">
              <input
                type="text"
                placeholder="owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <select
              value={hours}
              onChange={(e) => {
                const val = Number(e.target.value);
                setHours(val);
                if (repoUrl) loadTeamSync(repoUrl, val);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value={24}>Last 24 Hours</option>
              <option value={48}>Last 48 Hours</option>
              <option value={72}>Last 72 Hours</option>
              <option value={168}>Last 7 Days</option>
            </select>

            <button
              onClick={() => loadTeamSync()}
              disabled={loading || !repoUrl}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? "Analyzing..." : "Refresh Digest"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {data && (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Active Teammates</span>
              <p className="text-3xl lg:text-4xl font-black text-indigo-400 mt-2">{data.active_members_count}</p>
              <p className="text-xs text-slate-400 mt-1">Developers committing</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Total Commits</span>
              <p className="text-3xl lg:text-4xl font-black text-white mt-2">{data.total_commits}</p>
              <p className="text-xs text-slate-400 mt-1">Across all branches</p>
            </div>

            <div className="col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Daily Standup Digest</span>
                <p className="text-xs text-slate-400 mt-1 max-w-md">Formatted markdown summary ready to paste into Slack, Discord, or Microsoft Teams.</p>
              </div>
              <button
                onClick={handleCopyStandup}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 shrink-0 shadow-sm"
              >
                <span>{copied ? "✓ Copied to Clipboard!" : "📋 Copy Standup Digest"}</span>
              </button>
            </div>
          </div>

          {/* Category Breakdown Tags */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Work Focus Breakdown:</span>
            {Object.entries(data.category_breakdown).map(([cat, count]) => (
              <span
                key={cat}
                className="bg-slate-950 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-slate-800 text-slate-300"
              >
                {cat}: <strong className="text-white ml-1">{count}</strong>
              </span>
            ))}
          </div>

          {/* Teammates Activity Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.teammates.map((member) => (
              <div key={member.author} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-base">
                      {member.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">@{member.author}</h3>
                      <span className="text-xs text-slate-400 font-medium">Primary Focus: {member.primary_focus}</span>
                    </div>
                  </div>
                  <span className="bg-indigo-500/10 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/20">
                    {member.commit_count} commits
                  </span>
                </div>

                <div className="space-y-2.5">
                  {member.commits.map((c) => (
                    <div
                      key={c.sha}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-medium">{c.category}</span>
                          <span className="font-semibold text-slate-200 truncate">{c.message}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {c.date ? new Date(c.date).toLocaleString() : ""}
                        </span>
                      </div>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-blue-400 hover:underline shrink-0 font-bold"
                      >
                        {c.sha}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
