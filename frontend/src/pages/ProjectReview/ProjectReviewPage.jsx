import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { getProjectReview, exportProjectReviewToRepo } from "../../api/github";

export default function ProjectReviewPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
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
      loadReview(currentUrl);
    }
  }, [auditData]);

  const loadReview = async (targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await getProjectReview(targetUrl, githubToken);
      setData(res);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("404")) {
        setError("Repository not found or no public access. Please check the URL format.");
      } else {
        setError(msg || "Failed to generate project SCM review.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!data?.report_markdown) return;
    navigator.clipboard.writeText(data.report_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportToRepo = async () => {
    if (!data?.report_markdown) return;
    setExporting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await exportProjectReviewToRepo(repoUrl, data.report_markdown, "PROJECT_SCM_REPORT.md", githubToken);
      setNotice(`Report committed to repository root as PROJECT_SCM_REPORT.md (SHA: ${res.commit_sha})`);
    } catch (err) {
      setError(err.message || "Failed to commit report to repository.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Academic & Team Project Review</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Evaluation Packet Generator
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Generate an objective SCM grading packet (PROJECT_SCM_REPORT.md) detailing individual contributor work distribution, Conventional Commit adherence, and branch hygiene.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] lg:w-96">
              <input
                type="text"
                placeholder="owner/repo or full GitHub URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadReview()}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <button
              onClick={() => loadReview()}
              disabled={loading || !repoUrl}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {loading ? "Generating..." : "Generate Report"}
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
          {/* Executive Grade Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-black text-4xl text-purple-400 shadow-inner">
                {data.grade}
              </div>
              <div>
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">SCM Compliance Grade</span>
                <h3 className="text-xl lg:text-2xl font-bold text-white mt-1">{data.repository}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Criteria verified: <strong className="text-purple-300 font-mono">{data.score_criteria_met}</strong> standard SCM indicators passed
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopyMarkdown}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-5 py-3 rounded-xl border border-slate-700 transition shadow-sm"
              >
                {copied ? "✓ Copied to Clipboard!" : "📋 Copy Markdown"}
              </button>
              <button
                onClick={handleExportToRepo}
                disabled={exporting}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-purple-600/20"
              >
                {exporting ? "Publishing..." : "⚡ Commit to Repo"}
              </button>
            </div>
          </div>

          {/* Contributor Work Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
            <h3 className="text-base font-bold text-white mb-4">Contributor Work Split & Adherence</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Teammate</th>
                    <th className="pb-3">Commits</th>
                    <th className="pb-3">Work Share %</th>
                    <th className="pb-3">Conventional Commit Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {data.contributors.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40 transition">
                      <td className="py-3.5 font-bold text-white">@{c.author}</td>
                      <td className="py-3.5">{c.commits}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold">{c.share_percent}%</span>
                          <div className="w-28 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${c.share_percent}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-purple-300 font-bold">{c.conventional_commit_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SCM Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
            <h3 className="text-base font-bold text-white mb-4">SCM Submission Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-medium">.gitignore configured</span>
                <span className={data.checklist.gitignore ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {data.checklist.gitignore ? "✓ Configured" : "✕ Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-medium">Open-Source License</span>
                <span className={data.checklist.license ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {data.checklist.license ? "✓ Present" : "✕ Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-medium">CI / Automated Testing Workflow</span>
                <span className={data.checklist.ci_cd ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {data.checklist.ci_cd ? "✓ Configured" : "✕ Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-medium">Pull Request Review Discipline</span>
                <span className={data.checklist.pull_requests ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {data.checklist.pull_requests ? "✓ Verified" : "✕ Not Used"}
                </span>
              </div>
            </div>
          </div>

          {/* Markdown Preview Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Generated PROJECT_SCM_REPORT.md
              </span>
              <button onClick={handleCopyMarkdown} className="text-xs text-purple-400 hover:underline font-medium">
                Copy Full Markdown
              </button>
            </div>
            <pre className="bg-slate-950 p-5 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-80">
              {data.report_markdown}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
