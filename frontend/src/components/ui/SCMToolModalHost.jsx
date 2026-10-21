import { useState } from "react";
import { useSCM } from "../../context/SCMContext";

function SCMToolModalHost() {
  const { activeModal, modalPayload, modalLoading, closeModal, auditData } = useSCM();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'raw'
  const [appliedStatus, setAppliedStatus] = useState(null);

  if (!activeModal) return null;

  const repoName = auditData?.metadata?.name || "Repository";
  const owner = auditData?.metadata?.owner?.login || "Owner";

  const handleCopy = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (filename, content, type = "text/markdown;charset=utf-8;") => {
    if (!content) return;
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleApplyToGitHub = (actionName) => {
    setAppliedStatus(`Simulated GitHub Sync: Action '${actionName}' prepared and staged for PR creation.`);
    setTimeout(() => setAppliedStatus(null), 4000);
  };

  const renderModalContent = () => {
    if (modalLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-semibold text-base animate-pulse">
            Executing SCM Assistant Workflow: {activeModal}...
          </p>
          <p className="text-xs text-slate-400">
            Synthesizing repository artifacts, evaluating branch trees, and generating configurations...
          </p>
        </div>
      );
    }

    if (!modalPayload) {
      return (
        <div className="p-8 text-center text-slate-400">
          <p>No content generated for this action.</p>
        </div>
      );
    }

    // --- 1. README Generator ---
    if (activeModal === "README") {
      const { markdown, sections_generated, language } = modalPayload;
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-mono">
                {language}
              </span>
              <span className="text-xs text-slate-400">
                {sections_generated?.length || 0} Standardized SCM Sections Generated
              </span>
            </div>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 rounded font-medium transition ${activeTab === "preview" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Rendered Form
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1 rounded font-medium transition ${activeTab === "raw" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Raw Markdown
              </button>
            </div>
          </div>

          {activeTab === "preview" ? (
            <div className="space-y-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                  {sections_generated?.map((sec, i) => (
                    <span key={i} className="text-[11px] bg-slate-900 text-slate-300 border border-slate-700/80 px-2 py-0.5 rounded">
                      ✓ {sec}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {markdown}
                </div>
              </div>
            </div>
          ) : (
            <textarea
              readOnly
              value={markdown}
              rows={16}
              className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-4 rounded-xl border border-slate-800 outline-none focus:border-blue-500 resize-none"
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400">Target File: <code className="text-slate-200 font-mono">README.md</code></span>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(markdown)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
              >
                {copied ? "✓ Copied" : "📋 Copy Markdown"}
              </button>
              <button
                onClick={() => handleDownload("README.md", markdown)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
              >
                ⬇ Download README.md
              </button>
              <button
                onClick={() => handleApplyToGitHub("Create PR for README.md")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>Apply to GitHub</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // --- 2. Branch Strategy Generator ---
    if (activeModal === "BRANCH") {
      const { model, branches_taxonomy, action_items, markdown_guide } = modalPayload;
      return (
        <div className="space-y-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">SCM Model</span>
              <span className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                {model}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Structured multi-branch taxonomy providing isolation between experimental work, release stabilization, and production releases.
            </p>
          </div>

          {/* Branch Taxonomy Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-300 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Role & Purpose</th>
                  <th className="p-3">Access Level</th>
                  <th className="p-3">Merge Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {branches_taxonomy?.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-950/40">
                    <td className="p-3 font-mono font-bold text-blue-400 whitespace-nowrap">{b.name}</td>
                    <td className="p-3 text-slate-300">{b.purpose}</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">{b.access}</td>
                    <td className="p-3 text-slate-400">{b.merge_strategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actionable Commands */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Automated Setup Commands</h4>
            <div className="grid grid-cols-1 gap-2">
              {action_items?.map((item, i) => (
                <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white block">{item.action}</span>
                    <span className="text-[11px] text-slate-400">{item.rationale}</span>
                  </div>
                  <code className="text-xs font-mono text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 shrink-0">
                    {item.command}
                  </code>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => handleCopy(markdown_guide)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              {copied ? "✓ Copied" : "📋 Copy Branch Guide"}
            </button>
            <button
              onClick={() => handleDownload("BRANCH_STRATEGY.md", markdown_guide)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              ⬇ Download Policy .md
            </button>
          </div>
        </div>
      );
    }

    // --- 3. Release Planner ---
    if (activeModal === "RELEASE") {
      const { target_version, release_date, markdown_notes, checklist, metrics } = modalPayload;
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Target Milestone</span>
              <span className="text-lg font-mono font-black text-purple-400">{target_version}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Features Detected</span>
              <span className="text-lg font-bold text-emerald-400">{metrics?.features_count || 0}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Bug Fixes</span>
              <span className="text-lg font-bold text-amber-400">{metrics?.bug_fixes_count || 0}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Planned Date</span>
              <span className="text-sm font-semibold text-white mt-1 block">{release_date}</span>
            </div>
          </div>

          {/* Interactive Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Pre-Release Verification Checklist
            </h4>
            <div className="space-y-2">
              {checklist?.map((item, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer text-xs"
                >
                  <input type="checkbox" defaultChecked={i < 2} className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500" />
                  <span className="text-slate-200">{item.task}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Release Notes Preview */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Synthesized Release Notes Preview
            </h4>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {markdown_notes}
            </pre>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => handleCopy(markdown_notes)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              {copied ? "✓ Copied" : "📋 Copy Notes"}
            </button>
            <button
              onClick={() => handleDownload(`RELEASE-${target_version}.md`, markdown_notes)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              ⬇ Download Release Notes
            </button>
            <button
              onClick={() => handleApplyToGitHub(`Create Release Tag ${target_version}`)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <span>🏷️</span>
              <span>Publish Release Tag</span>
            </button>
          </div>
        </div>
      );
    }

    // --- 4. Commit Assistant ---
    if (activeModal === "COMMIT") {
      const { compliance_percentage, unstructured_count, audited_commits, guide_markdown } = modalPayload;
      return (
        <div className="space-y-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block">Commit Message Hygiene Compliance</span>
              <span className="text-2xl font-black text-cyan-400">{compliance_percentage}%</span>
            </div>
            <span className="text-xs bg-amber-950/70 text-amber-300 border border-amber-800 px-3 py-1 rounded-full">
              {unstructured_count} Substandard Message(s) Auto-Rewritten
            </span>
          </div>

          {/* Substandard Messages Rewriting Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Commit Rewriter Simulator (Before vs. After)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">SHA</th>
                    <th className="p-3">Original Substandard Commit</th>
                    <th className="p-3">Suggested Conventional Rewrite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {audited_commits?.slice(0, 10).map((c, i) => (
                    <tr key={i} className="hover:bg-slate-950/50">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{c.sha}</td>
                      <td className="p-3 font-mono text-red-300">{c.original_message}</td>
                      <td className="p-3 font-mono text-emerald-400 font-medium">
                        {c.suggested_rewrite || "✓ Already Conventional"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => handleCopy(guide_markdown)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              {copied ? "✓ Copied" : "📋 Copy Commit Guide"}
            </button>
            <button
              onClick={() => handleDownload("COMMIT_CONVENTION.md", guide_markdown)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              ⬇ Download COMMIT_CONVENTION.md
            </button>
          </div>
        </div>
      );
    }

    // --- 5. Workflow Generator ---
    if (activeModal === "WORKFLOW") {
      const { filename, target_path, language, yaml_content } = modalPayload;
      return (
        <div className="space-y-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Target Workflow File</span>
              <code className="text-sm font-mono text-blue-400 font-bold">{target_path}</code>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-mono">
              Tailored for {language}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              GitHub Actions YAML Pipeline
            </h4>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-300 border border-slate-800 whitespace-pre-wrap max-h-80 overflow-y-auto">
              {yaml_content}
            </pre>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => handleCopy(yaml_content)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              {copied ? "✓ Copied" : "📋 Copy YAML"}
            </button>
            <button
              onClick={() => handleDownload(filename, yaml_content, "text/yaml;charset=utf-8;")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              ⬇ Download {filename}
            </button>
            <button
              onClick={() => handleApplyToGitHub(`Commit ${target_path}`)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Apply to .github/workflows</span>
            </button>
          </div>
        </div>
      );
    }

    // --- 6. Change Impact Analysis ---
    if (activeModal === "IMPACT") {
      const { risk_level, risk_score, merge_conflict_probability, conflict_assessment, risk_factors, affected_modules, recommendation } = modalPayload;
      const isHigh = risk_level === "High";
      const isMed = risk_level === "Medium";
      const badgeColor = isHigh ? "text-red-400 bg-red-950 border-red-800" : isMed ? "text-amber-400 bg-amber-950 border-amber-800" : "text-emerald-400 bg-emerald-950 border-emerald-800";

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Overall Volatility Risk</span>
              <span className={`text-xl font-black mt-1 inline-block px-2.5 py-0.5 rounded border ${badgeColor}`}>
                {risk_level} ({risk_score}/100)
              </span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Merge Conflict Probability</span>
              <span className="text-xl font-black text-amber-400 mt-1 block">
                {merge_conflict_probability}%
              </span>
              <span className="text-[11px] text-slate-500">{conflict_assessment}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Target Repository</span>
              <span className="text-sm font-bold text-white mt-1 block truncate">
                {owner}/{repoName}
              </span>
            </div>
          </div>

          {/* Module Sensitivity Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Affected Modules & Surface Area Sensitivity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {affected_modules?.map((m, i) => (
                <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{m.module}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${m.sensitivity === "Critical" ? "text-red-400 bg-red-950/60" : "text-blue-400 bg-blue-950/60"}`}>
                      {m.sensitivity}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">Impacted: {m.files?.join(", ")}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Identified Risk Factors</h4>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc ml-4">
              {risk_factors?.map((rf, i) => (
                <li key={i}>{rf}</li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
              <strong className="text-blue-400">💡 SCM Recommendation: </strong>
              <span>{recommendation}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={closeModal}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
            >
              Done Reviewing Impact
            </button>
          </div>
        </div>
      );
    }

    // --- 7. Full Markdown Report ---
    if (activeModal === "REPORT") {
      return (
        <div className="space-y-4">
          <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {typeof modalPayload === "string" ? modalPayload : JSON.stringify(modalPayload, null, 2)}
          </pre>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => handleCopy(modalPayload)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              {copied ? "✓ Copied" : "📋 Copy Markdown"}
            </button>
            <button
              onClick={() => handleDownload("SCM-AUDIT-REPORT.md", modalPayload)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              ⬇ Download Report
            </button>
          </div>
        </div>
      );
    }

    // --- 8. Multi-format Export Center ---
    if (activeModal === "EXPORT") {
      const exportJson = JSON.stringify(auditData, null, 2);
      return (
        <div className="space-y-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-1">📦 SCM Configuration Bundle Export</h4>
            <p className="text-xs text-slate-400">
              Export all synthesized artifacts, checklists, and audit policies for repository <strong>{owner}/{repoName}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => handleDownload(`${repoName}-scm-audit.json`, exportJson, "application/json")}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 transition text-left flex items-start gap-3"
            >
              <span className="text-2xl">📋</span>
              <div>
                <span className="font-bold text-white block">Raw JSON SCM Audit Data</span>
                <span className="text-slate-400 text-[11px]">Complete machine-readable SCM metrics</span>
              </div>
            </button>

            <button
              onClick={() => handleDownload(`${repoName}-audit.md`, auditData?.report?.summary || "# SCM Audit")}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 transition text-left flex items-start gap-3"
            >
              <span className="text-2xl">📑</span>
              <div>
                <span className="font-bold text-white block">Markdown Executive Report</span>
                <span className="text-slate-400 text-[11px]">Formatted GitHub-Flavored summary</span>
              </div>
            </button>
          </div>

          <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-slate-300">
            <p className="font-semibold text-blue-400 mb-1">📄 PDF Export (Planned Extension)</p>
            <p className="text-slate-400">Print or save as PDF directly from the Markdown viewer using your browser print command (Ctrl+P / Cmd+P).</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const getModalTitle = () => {
    switch (activeModal) {
      case "README": return { title: "Enterprise README Generator", icon: "📄" };
      case "BRANCH": return { title: "SCM Branch Strategy & Lifecycle Generator", icon: "🌿" };
      case "RELEASE": return { title: "Release Planner & SemVer Synthesizer", icon: "🏷️" };
      case "COMMIT": return { title: "Commit Assistant & Conventional Rewriter", icon: "💬" };
      case "WORKFLOW": return { title: "GitHub Actions CI Workflow Generator", icon: "⚡" };
      case "IMPACT": return { title: "Change Impact Analysis & Risk Estimator", icon: "🎯" };
      case "REPORT": return { title: "SCM Audit & Health Report", icon: "📑" };
      case "EXPORT": return { title: "Multi-Format SCM Export Center", icon: "📦" };
      default: return { title: "SCM Assistant Tool", icon: "⚡" };
    }
  };

  const { title, icon } = getModalTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Target: <strong className="text-blue-400">{owner}/{repoName}</strong></p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white text-2xl font-bold p-1 leading-none transition"
          >
            ×
          </button>
        </div>

        {/* Applied Notification Banner */}
        {appliedStatus && (
          <div className="px-6 py-2.5 bg-emerald-950 text-emerald-300 border-b border-emerald-800 text-xs flex items-center gap-2">
            <span>✅</span>
            <span>{appliedStatus}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 font-sans">
          {renderModalContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
          <span>Sync SCM Assistant Core Engine v2.5</span>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white text-xs font-semibold underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SCMToolModalHost;
