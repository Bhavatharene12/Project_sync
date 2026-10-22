import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { getContributionDiagnosis } from "../../api/github";

export default function ContributionDoctorPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
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
      diagnose(currentUrl);
    }
  }, [auditData]);

  const diagnose = async (targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getContributionDiagnosis(targetUrl, githubToken);
      setData(res);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("403") || msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("scope")) {
        // Friendly fallback rather than raw 403
        setError("Note: Personal Access Token requires the 'user:email' scope to view private emails. Commit analysis is still available.");
      } else if (msg.includes("404")) {
        setError("Repository not found or no public access. Please verify the URL format.");
      } else {
        setError(msg || "Failed to diagnose contributions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🟩</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Contribution Doctor</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Identity & Credit Troubleshooter
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Diagnose why your GitHub contribution squares aren't turning green (mismatched local git author email, fork isolation, or unmerged branch commits) and fix your git configuration with 1-click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] lg:w-96">
              <input
                type="text"
                placeholder="owner/repo or full GitHub URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && diagnose()}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition placeholder-slate-500 font-mono"
              />
            </div>
            <button
              onClick={() => diagnose()}
              disabled={loading || !repoUrl}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Diagnosing...</span>
                </>
              ) : (
                <>
                  <span>🩺</span>
                  <span>Diagnose Identity</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Friendly Token Scope Notice */}
        {data?.token_scope_notice && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2.5">
            <span>ℹ️</span>
            <span>{data.token_scope_notice}</span>
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
          {/* Identity Snapshot Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-8">
              <div>
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">GitHub Profile</span>
                <p className="text-sm font-bold text-white mt-1">
                  {data.authenticated_as ? `@${data.authenticated_as}` : "Public / Unauthenticated"}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Default Branch</span>
                <p className="text-sm font-mono text-emerald-400 font-bold mt-1">{data.default_branch}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Repository Type</span>
                <p className="text-sm font-bold text-slate-200 mt-1">
                  {data.is_fork ? "Fork Repository" : "Root Repository"}
                </p>
              </div>
            </div>

            {data.quick_fix_command && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Global Git Config Fix:</span>
                <code className="text-xs font-mono text-emerald-400 select-all">{data.quick_fix_command}</code>
                <button
                  onClick={() => handleCopy(data.quick_fix_command)}
                  className="bg-slate-800 hover:bg-slate-700 text-xs text-white px-3 py-1.5 rounded-lg transition font-bold shrink-0 border border-slate-700"
                >
                  {copied ? "✓ Copied" : "Copy Fix"}
                </button>
              </div>
            )}
          </div>

          {/* Diagnosis Cards */}
          <div className="space-y-4">
            {data.diagnoses.map((d, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border transition ${
                  d.severity === "CRITICAL"
                    ? "bg-rose-950/20 border-rose-500/40"
                    : d.severity === "WARNING"
                    ? "bg-amber-950/20 border-amber-500/40"
                    : "bg-emerald-950/20 border-emerald-500/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">
                      {d.severity === "CRITICAL" ? "🚨" : d.severity === "WARNING" ? "⚠️" : "✅"}
                    </span>
                    <h3 className="text-base lg:text-lg font-bold text-white">{d.title}</h3>
                  </div>
                  <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">{d.description}</p>
                  
                  {d.fix_guide && (
                    <div className="mt-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-xs uppercase font-bold text-slate-400 block mb-1.5">
                        Recommended Fix:
                      </span>
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{d.fix_guide}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Detected Authors Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
            <h3 className="text-base font-bold text-white mb-4">Commit Author Identity Audit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Git Author Name</th>
                    <th className="pb-3">Git Author Email</th>
                    <th className="pb-3">Commits Tracked</th>
                    <th className="pb-3">GitHub Profile Linkage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {data.detected_authors.map((auth, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40 transition">
                      <td className="py-3 font-semibold text-white">{auth.name}</td>
                      <td className="py-3 font-mono text-slate-300">{auth.email}</td>
                      <td className="py-3 font-bold">{auth.commit_count}</td>
                      <td className="py-3">
                        {auth.matched_github_user ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <span>✓</span>
                            <span>Linked (@{auth.matched_github_user})</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                            <span>✕</span>
                            <span>Unlinked Email (No Green Squares)</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
