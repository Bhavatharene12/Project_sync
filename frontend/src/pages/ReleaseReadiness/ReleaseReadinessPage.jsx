import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { getReleaseReadiness, installEssential } from "../../api/github";

export default function ReleaseReadinessPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("checklist"); // 'checklist', 'changelog', 'notes'
  const [copied, setCopied] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const currentUrl =
      auditData?.metadata?.html_url ||
      (auditData?.report?.owner && auditData?.report?.repository
        ? `https://github.com/${auditData.report.owner}/${auditData.report.repository}`
        : "");
    if (currentUrl) {
      setRepoUrl(currentUrl);
      loadReadiness(currentUrl);
    } else {
      loadReadiness("demo/sync-repository");
    }
  }, [auditData]);

  const loadReadiness = async (targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await getReleaseReadiness(targetUrl, githubToken);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to audit release readiness.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCommand = () => {
    if (!data?.git_release_command) return;
    navigator.clipboard.writeText(data.git_release_command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommitChangelog = async () => {
    if (!data?.generated_changelog) return;
    setCommitting(true);
    setNotice(null);
    try {
      await installEssential(
        repoUrl || data.repository,
        "CHANGELOG.md",
        data.generated_changelog,
        `docs(release): prepare CHANGELOG for ${data.suggested_version}`,
        null,
        githubToken
      );
      setNotice(`CHANGELOG.md published directly to repository for ${data.suggested_version}!`);
      loadReadiness();
    } catch (err) {
      alert(err.message || "Failed to commit CHANGELOG.");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Release Readiness Checker</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Pre-Flight Release Audit
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Cut release preparation from 30 minutes down to under 2 minutes. Audits test results, branch stability, SemVer calculations, and generates release notes automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] lg:w-96">
              <input
                type="text"
                placeholder="owner/repo or full GitHub URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadReadiness()}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-500 font-mono"
              />
            </div>
            <button
              onClick={() => loadReadiness()}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {loading ? "Auditing..." : "Audit Release Readiness"}
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
          {/* Executive Readiness Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Readiness Gauge */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Pre-Release Readiness</span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-5xl lg:text-6xl font-black text-emerald-400">{data.readiness_percentage}%</span>
                  <span className="text-slate-400 text-lg font-bold">Ready</span>
                </div>
                <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {data.recommendation_summary}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Estimated Prep Time:</span>
                  <strong className="text-white font-mono">{data.estimated_prep_minutes} minutes</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Release Candidate:</span>
                  <strong className="text-emerald-400 font-mono font-bold">{data.suggested_version}</strong>
                </div>
              </div>
            </div>

            {/* Semantic Versioning Resolution Card */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Semantic Versioning Engine</span>
                  <span className="text-xs bg-blue-500/10 text-blue-400 font-bold font-mono px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    {data.version_bump_type} BUMP
                  </span>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">Current Version</span>
                    <span className="text-2xl lg:text-3xl font-black text-slate-300 font-mono">{data.current_version}</span>
                  </div>
                  <span className="text-2xl text-slate-500">→</span>
                  <div>
                    <span className="text-xs text-emerald-400 font-bold block">Suggested Next Version</span>
                    <span className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono">{data.suggested_version}</span>
                  </div>
                </div>

                <p className="text-xs lg:text-sm text-slate-300 mt-3 leading-relaxed">
                  <strong>Rationale:</strong> {data.version_rationale}
                </p>

                <div className="flex flex-wrap gap-3 pt-3 text-xs">
                  <span className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-300">
                    ✨ <strong>{data.commit_metrics.features_count}</strong> Features
                  </span>
                  <span className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-300">
                    🐛 <strong>{data.commit_metrics.fixes_count}</strong> Fixes
                  </span>
                  <span className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-300">
                    ⚠️ <strong>{data.commit_metrics.breaking_count}</strong> Breaking Changes
                  </span>
                </div>
              </div>

              {/* Copy Git Tag Command */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <code className="text-xs font-mono text-emerald-400 truncate select-all">{data.git_release_command}</code>
                <button
                  onClick={handleCopyCommand}
                  className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white px-4 py-2 rounded-lg transition shrink-0 border border-slate-700"
                >
                  {copied ? "✓ Copied" : "Copy Git Tag Command"}
                </button>
              </div>
            </div>
          </div>

          {/* Action Toolbar & Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("checklist")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "checklist" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                ✔ Release Checklist ({data.checklist.filter(c => c.status).length}/{data.checklist.length})
              </button>
              <button
                onClick={() => setActiveTab("changelog")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "changelog" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                📝 Generated CHANGELOG
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "notes" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                📢 Release Notes
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCommitChangelog}
                disabled={committing}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <span>{committing ? "Publishing..." : "⚡ 1-Click Commit CHANGELOG.md"}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Release Checklist */}
          {activeTab === "checklist" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
              <h3 className="text-base font-bold text-white mb-2">Automated Pre-Release Verification Gates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                      item.status
                        ? "bg-slate-950/70 border-slate-800"
                        : "bg-slate-950/80 border-amber-500/40"
                    }`}
                  >
                    <span className={`text-lg ${item.status ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}`}>
                      {item.status ? "✔" : "⚠"}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <span className="text-[10px] font-mono uppercase bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Generated CHANGELOG */}
          {activeTab === "changelog" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Synthesized CHANGELOG.md Content</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Categorized automatically from conventional commit messages.</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(data.generated_changelog);
                    alert("CHANGELOG copied to clipboard!");
                  }}
                  className="text-xs text-blue-400 hover:underline font-medium"
                >
                  Copy Raw Text
                </button>
              </div>
              <pre className="bg-slate-950 p-5 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-96">
                {data.generated_changelog}
              </pre>
            </div>
          )}

          {/* Tab 3: Release Notes */}
          {activeTab === "notes" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Generated GitHub Release Announcement</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ready to paste into GitHub Releases or email updates.</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(data.generated_release_notes);
                    alert("Release notes copied to clipboard!");
                  }}
                  className="text-xs text-blue-400 hover:underline font-medium"
                >
                  Copy Release Notes
                </button>
              </div>
              <pre className="bg-slate-950 p-5 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-96">
                {data.generated_release_notes}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
