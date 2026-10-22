import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { predictMergeConflicts } from "../../api/github";

export default function ConflictPredictorPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [targetBranch, setTargetBranch] = useState("feature/auth-refresh");
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
      runPrediction(currentUrl);
    } else {
      runPrediction("demo/sync-repository");
    }
  }, [auditData]);

  const runPrediction = async (targetUrl = repoUrl, bBranch = baseBranch, tBranch = targetBranch) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await predictMergeConflicts(targetUrl, bBranch, tBranch, githubToken);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to predict merge conflicts.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyStrategy = () => {
    if (!data) return;
    const lines = [
      `# Merge Conflict Prediction & Strategy Report for ${data.repository}`,
      `Base Branch: ${data.base_branch} | Target Branch: ${data.target_branch}`,
      `Conflict Probability: ${data.conflict_probability}% (${data.risk_level} RISK)`,
      "",
      "## Conflict Reasons:",
      ...data.conflict_reasons.map(r => `- ${r.file}: ${r.reason} (${r.resolution_tip})`),
      "",
      "## Recommended Merge Order Strategy:",
      ...data.preventive_suggestions.map(s => `${s.order}. ${s.action} - ${s.why}`)
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔮</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Merge Conflict Predictor</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Predictive SCM Engine
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Don't wait until a pull request fails with merge conflicts. Analyzes cross-branch commit histories, overlapping files, and developer touches to predict collisions before they happen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2 w-48 font-mono"
            />
            <input
              type="text"
              placeholder="base branch (e.g. main)"
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2 w-32 font-mono"
            />
            <input
              type="text"
              placeholder="target branch"
              value={targetBranch}
              onChange={(e) => setTargetBranch(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2 w-44 font-mono"
            />
            <button
              onClick={() => runPrediction(repoUrl, baseBranch, targetBranch)}
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
            >
              {loading ? "Simulating..." : "Predict Conflicts"}
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
          {/* Real-time Developer Sync Warning */}
          {data.developer_sync_warning && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    Developer Collision Warning: {data.developer_sync_warning.file}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Another developer ({data.developer_sync_warning.modified_by}) modified this file {data.developer_sync_warning.when}.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-200 bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 shrink-0">
                {data.developer_sync_warning.advice}
              </span>
            </div>
          )}

          {/* Master Probability Gauge & Branch Comparator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Probability Gauge */}
            <div className={`p-6 lg:p-8 rounded-2xl border flex flex-col justify-between space-y-6 ${
              data.risk_level === "CRITICAL" || data.risk_level === "HIGH"
                ? "bg-rose-950/20 border-rose-500/40"
                : data.risk_level === "MEDIUM"
                ? "bg-amber-950/20 border-amber-500/40"
                : "bg-emerald-950/20 border-emerald-500/40"
            }`}>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Conflict Likelihood</span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className={`text-5xl lg:text-6xl font-black ${
                    data.conflict_probability >= 70 ? "text-rose-400" :
                    data.conflict_probability >= 40 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {data.conflict_probability}%
                  </span>
                  <span className="text-xl font-bold uppercase tracking-wider text-white">
                    {data.risk_level} RISK
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {data.predicted_status}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Overlapping Files:</span>
                  <strong className="text-white font-mono">{data.summary.overlapping_files_count} files</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Reduction with Strategy:</span>
                  <strong className="text-emerald-400 font-mono font-bold">-{data.summary.estimated_conflict_reduction_with_strategy}</strong>
                </div>
              </div>
            </div>

            {/* Branch Comparison & Preventive Strategy */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Branch Divergence</span>
                  <button
                    onClick={handleCopyStrategy}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    {copied ? "✓ Copied Strategy" : "📋 Copy Strategy"}
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex-1">
                    <span className="text-xs text-slate-500 font-medium block">Base Branch</span>
                    <strong className="text-sm font-mono text-white">{data.base_branch}</strong>
                  </div>
                  <span className="text-xl text-slate-500">⟵</span>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex-1">
                    <span className="text-xs text-slate-500 font-medium block">Target Feature Branch</span>
                    <strong className="text-sm font-mono text-rose-300">{data.target_branch}</strong>
                  </div>
                </div>

                {/* Preventive Sequencing Strategy */}
                <div className="mt-5 space-y-2.5">
                  <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                    Recommended Preventive Merge Strategy
                  </span>
                  <div className="space-y-2">
                    {data.preventive_suggestions.map((s) => (
                      <div key={s.order} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3 text-xs">
                        <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold shrink-0 mt-0.5">
                          {s.order}
                        </span>
                        <div>
                          <strong className="text-white block font-semibold">{s.action}</strong>
                          <span className="text-slate-400 text-[11px]">{s.why}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conflict Reasons & Hotspot Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conflict Reasons (2 Cols) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Specific File Collision Predictions</h3>
                <span className="text-xs text-slate-400 font-mono">{data.conflict_reasons.length} files at risk</span>
              </div>

              <div className="space-y-3">
                {data.conflict_reasons.map((r, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {r.file}
                      </code>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        r.severity === "CRITICAL" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        r.severity === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {r.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{r.reason}</p>

                    <div className="p-2.5 bg-slate-900/60 rounded-lg text-xs text-slate-400 border border-slate-850 flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">💡</span>
                      <span>{r.resolution_tip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotspots Heatmap (1 Col) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Repository Hotspots</h3>
                <span className="text-xs text-slate-400">Activity Heat</span>
              </div>
              <p className="text-xs text-slate-400">
                Directory regions with high commit density across multiple developers.
              </p>

              <div className="space-y-3 pt-2">
                {data.hotspots.map((h, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-white block">{h.path}</span>
                      <span className="text-[11px] text-slate-400">{h.recent_touches} touches across {h.file_count} files</span>
                    </div>
                    <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full uppercase border ${
                      h.risk === "HIGH" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                      h.risk === "MEDIUM" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {h.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          {data.timeline && data.timeline.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Cross-Branch Developer Activity Timeline</h3>
                <span className="text-xs text-slate-400">Sequential Edits</span>
              </div>

              <div className="space-y-3">
                {data.timeline.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                    <span className="font-mono text-slate-400 text-[11px] shrink-0 pt-0.5">{t.time_label}</span>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-white">@{t.developer}</strong>
                        <span className="font-mono text-[11px] text-blue-400">({t.branch})</span>
                      </div>
                      <p className="text-slate-300">{t.action}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-400 shrink-0 font-mono">{t.risk_impact} Risk</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
