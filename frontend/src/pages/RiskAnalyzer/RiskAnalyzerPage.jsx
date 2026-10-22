import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { getRiskAnalysis, installEssential } from "../../api/github";

export default function RiskAnalyzerPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [installing, setInstalling] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const currentUrl =
      auditData?.metadata?.html_url ||
      (auditData?.report?.owner && auditData?.report?.repository
        ? `https://github.com/${auditData.report.owner}/${auditData.report.repository}`
        : "");
    if (currentUrl) {
      setRepoUrl(currentUrl);
      loadAnalysis(currentUrl);
    } else {
      // Default report-ready demo
      loadAnalysis("demo/sync-repository");
    }
  }, [auditData]);

  const loadAnalysis = async (targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    setActionNotice(null);
    try {
      const res = await getRiskAnalysis(targetUrl, githubToken);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load risk analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleInstallFile = async (fileName) => {
    setInstalling(fileName);
    try {
      await installEssential(
        repoUrl || data?.repository,
        fileName,
        null,
        `chore(scm): add ${fileName} via Sync Risk Analyzer`,
        null,
        githubToken
      );
      setActionNotice(`Successfully committed ${fileName} to repository.`);
      loadAnalysis();
    } catch (err) {
      alert(err.message || `Failed to install ${fileName}.`);
    } finally {
      setInstalling(null);
    }
  };

  const handleCopySummary = () => {
    if (!data) return;
    const summaryText = `Repository SCM Risk Audit for ${data.repository}\n` +
      `Overall Health Score: ${data.health_score}/100 (Grade ${data.grade})\n` +
      `Commit Quality: ${data.breakdown.commit_quality.score}%\n` +
      `Documentation: ${data.documentation_audit.score}\n` +
      `CI Health: ${data.ci_analysis.status}\n` +
      `Branch Hygiene: ${data.breakdown.branch_hygiene.score}%\n` +
      `Smart Recommendations: ${data.smart_recommendations.length} items`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SCM_RISK_REPORT_${data.repository.replace("/", "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Repository Risk Analyzer</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                SCM Health Engine
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Identify hidden SCM risks across commit hygiene, branch decay, missing documentation, CI/CD reliability, and release frequency before they cause merge failures or broken builds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] lg:w-96">
              <input
                type="text"
                placeholder="owner/repo or full GitHub URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadAnalysis()}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-500 font-mono"
              />
            </div>
            <button
              onClick={() => loadAnalysis()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? "Analyzing..." : "Analyze Risks"}
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

      {data && (
        <>
          {/* Executive Score & Health Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Master Score Dial */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Repository SCM Health</span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-5xl lg:text-6xl font-black text-white">{data.health_score}</span>
                  <span className="text-slate-400 text-xl font-bold">/ 100</span>
                  <span className={`ml-auto text-2xl font-black px-4 py-1 rounded-2xl border ${
                    data.grade.startsWith("A") ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                    data.grade === "B" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                    "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}>
                    Grade {data.grade}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {data.grade_description}
                </p>
              </div>

              {/* Export Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
                <button
                  onClick={handleCopySummary}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition"
                >
                  {copied ? "✓ Copied" : "📋 Copy Summary"}
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition"
                >
                  💾 Download JSON
                </button>
              </div>
            </div>

            {/* Health Breakdown Progress Bars */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">SCM Health Dimension Breakdown</span>
                <span className="text-xs text-slate-400 font-mono">Weighted Composite</span>
              </div>

              <div className="space-y-4 pt-1">
                {Object.entries(data.breakdown).map(([dim, val]) => {
                  const labels = {
                    commit_quality: "Commit Quality & Conventions",
                    documentation: "Documentation & Policies",
                    ci_health: "Continuous Integration (CI)",
                    branch_hygiene: "Branch Hygiene & Decay",
                    release_hygiene: "Release Cadence & SemVer"
                  };
                  return (
                    <div key={dim} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{labels[dim] || dim}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono">({val.status})</span>
                          <span className="font-bold text-white font-mono">{val.score}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-850">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            val.score >= 80 ? "bg-emerald-500" :
                            val.score >= 65 ? "bg-blue-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${val.score}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Dimension Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Commit Quality Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Commit Quality</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{data.commit_analysis.conventional_adherence_percent}% Compliant</span>
              </div>
              <p className="text-xs text-slate-400">
                Audited last {data.commit_analysis.total_sampled} commits for conventional prefixing and descriptive message length.
              </p>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Vague / Substandard Titles:</span>
                  <strong className={data.commit_analysis.vague_count > 0 ? "text-amber-400" : "text-emerald-400"}>
                    {data.commit_analysis.vague_count}
                  </strong>
                </div>
                {data.commit_analysis.vague_samples && data.commit_analysis.vague_samples.length > 0 && (
                  <div className="pt-1 text-[11px] text-slate-400 italic">
                    Samples: "{data.commit_analysis.vague_samples.slice(0, 2).join('", "')}"
                  </div>
                )}
              </div>
            </div>

            {/* Branch Health Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Branch Health</span>
                <span className="text-xs font-bold text-blue-400 font-mono">{data.branch_analysis.total_branches} Branches</span>
              </div>
              <p className="text-xs text-slate-400">
                Detects unmerged branches inactive for &gt; 14 days that clutter the git tree and cause merge drift.
              </p>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Stale Branches Detected:</span>
                  <strong className={data.branch_analysis.stale_count > 0 ? "text-rose-400" : "text-emerald-400"}>
                    {data.branch_analysis.stale_count}
                  </strong>
                </div>
                {data.branch_analysis.stale_branches && data.branch_analysis.stale_branches.length > 0 && (
                  <div className="pt-1 text-[11px] text-indigo-300 font-mono truncate">
                    Oldest: {data.branch_analysis.stale_branches[0].name} ({data.branch_analysis.stale_branches[0].age_days}d)
                  </div>
                )}
              </div>
            </div>

            {/* Documentation Completeness */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Documentation Audit</span>
                <span className="text-xs font-bold text-purple-400 font-mono">{data.documentation_audit.score} Files</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {data.documentation_audit.files.map((f) => (
                  <div key={f.name} className="flex items-center gap-1.5 p-1.5 bg-slate-950/60 rounded-lg border border-slate-850">
                    <span className={f.present ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {f.present ? "✓" : "✕"}
                    </span>
                    <span className="font-mono text-[11px] text-slate-300 truncate">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CI Health Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">CI / Build Health</span>
                <span className={`text-xs font-bold font-mono ${data.ci_analysis.status === "Healthy" ? "text-emerald-400" : "text-amber-400"}`}>
                  {data.ci_analysis.status}
                </span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Pass Rate:</span>
                  <strong className="text-white font-mono">{data.ci_analysis.pass_rate_percent}%</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Recent Runs Tracked:</span>
                  <strong className="text-white font-mono">{data.ci_analysis.recent_runs} ({data.ci_analysis.failed_runs} failed)</strong>
                </div>
              </div>
            </div>

            {/* Release Hygiene Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Release Hygiene</span>
                <span className="text-xs font-bold text-blue-400 font-mono">{data.release_analysis.latest_tag}</span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Cadence Status:</span>
                  <strong className="text-white font-mono">{data.release_analysis.cadence_status}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Semantic Versioning:</span>
                  <strong className={data.release_analysis.semver_compliant ? "text-emerald-400" : "text-amber-400"}>
                    {data.release_analysis.semver_compliant ? "Compliant (vX.Y.Z)" : "Non-Standard Tag"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Recommendations Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base lg:text-lg font-bold text-white">Actionable SCM Improvement Recommendations</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Priority fixes calculated to deliver the highest immediate gains to your repository stability.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {data.smart_recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        rec.priority === "HIGH" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {rec.estimated_score_improvement}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                      {rec.description}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {rec.target_file ? (
                      <button
                        onClick={() => handleInstallFile(rec.target_file)}
                        disabled={installing === rec.target_file}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        {installing === rec.target_file ? "Installing..." : `⚡ 1-Click Install ${rec.target_file}`}
                      </button>
                    ) : (
                      <span className="text-xs text-blue-400 font-semibold px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        Guided Practice
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
