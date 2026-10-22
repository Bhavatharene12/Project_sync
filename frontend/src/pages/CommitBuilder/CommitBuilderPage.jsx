import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import {
  synthesizeCommit,
  getRecentCommitsForAssistant,
  analyzeCommitWithFiles
} from "../../api/github";

export default function CommitBuilderPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [mode, setMode] = useState("draft"); // 'draft' or 'history'

  // Draft mode states
  const [draftMessage, setDraftMessage] = useState("");
  const [diffText, setDiffText] = useState("");
  const [showDiffInput, setShowDiffInput] = useState(false);

  // History mode states
  const [recentCommits, setRecentCommits] = useState([]);
  const [selectedSha, setSelectedSha] = useState("");
  const [loadingCommits, setLoadingCommits] = useState(false);

  // General states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const currentUrl =
      auditData?.metadata?.html_url ||
      (auditData?.report?.owner && auditData?.report?.repository
        ? `https://github.com/${auditData.report.owner}/${auditData.report.repository}`
        : "");
    if (currentUrl) {
      setRepoUrl(currentUrl);
      loadRecentCommits(currentUrl);
    }
  }, [auditData]);

  const loadRecentCommits = async (targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoadingCommits(true);
    try {
      const commits = await getRecentCommitsForAssistant(targetUrl, githubToken);
      setRecentCommits(commits || []);
      if (commits && commits.length > 0 && !selectedSha) {
        setSelectedSha(commits[0].sha);
      }
    } catch (e) {
      console.debug("Recent commits fetch error:", e);
    } finally {
      setLoadingCommits(false);
    }
  };

  const handleSynthesizeDraft = async (e) => {
    e?.preventDefault();
    if (!draftMessage.trim() && !diffText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await synthesizeCommit(draftMessage, diffText || null);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to synthesize commit message.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeHistoryCommit = async (shaToAnalyze = selectedSha) => {
    if (!shaToAnalyze || !repoUrl) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeCommitWithFiles(repoUrl, shaToAnalyze, githubToken);
      setResult({
        ...data,
        conventional_message: data.improved_title,
        full_message: `${data.improved_title}\n\n${data.body}`
      });
    } catch (err) {
      setError(err.message || "Failed to analyze commit files.");
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
              <span className="text-3xl">✍️</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Smart Commit Assistant</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Conventional Commits 1.0
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Synthesize vague drafts into atomic, traceable Conventional Commits, or analyze recent commits and actual changed files to generate standardized release messages.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => { setMode("draft"); setResult(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                mode === "draft" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>✍️</span>
              <span>Draft or Diff Input</span>
            </button>
            <button
              onClick={() => {
                setMode("history");
                setResult(null);
                if (recentCommits.length === 0 && repoUrl) loadRecentCommits();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                mode === "history" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🔍</span>
              <span>Analyze Recent Commits</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Mode 1: Draft or Diff Form */}
      {mode === "draft" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              What did you work on? (Draft note, task description, or informal message)
            </label>
            <input
              type="text"
              placeholder="e.g. fixed login token verification and added responsive navbar styles"
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSynthesizeDraft()}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-500"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowDiffInput(!showDiffInput)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5"
            >
              <span>{showDiffInput ? "− Hide Git Diff Input" : "+ Paste Git Diff (Optional)"}</span>
            </button>
            {showDiffInput && (
              <textarea
                placeholder="Paste git diff snippet here..."
                value={diffText}
                onChange={(e) => setDiffText(e.target.value)}
                rows={4}
                className="mt-2.5 w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-blue-500 transition"
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium mr-1">Quick Presets:</span>
              {["fix login bug", "implement stripe payments", "refactor api routes", "update readme docs"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDraftMessage(preset)}
                  className="text-xs bg-slate-950 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 transition"
                >
                  "{preset}"
                </button>
              ))}
            </div>

            <button
              onClick={handleSynthesizeDraft}
              disabled={loading || (!draftMessage && !diffText)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 shrink-0"
            >
              {loading ? "Synthesizing..." : "Synthesize Conventional Commit →"}
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Analyze From Repository Commit History */}
      {mode === "history" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Select a Commit to Analyze Changed Files</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspects modified files from GitHub API and synthesizes an improved Conventional Commit message.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 w-52 font-mono"
              />
              <button
                onClick={() => loadRecentCommits()}
                disabled={loadingCommits || !repoUrl}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition"
              >
                {loadingCommits ? "Loading..." : "Fetch Commits"}
              </button>
            </div>
          </div>

          {/* Commits List */}
          {recentCommits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {recentCommits.map((c) => (
                <div
                  key={c.sha}
                  onClick={() => setSelectedSha(c.sha)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                    selectedSha === c.sha
                      ? "bg-blue-600/10 border-blue-500 text-white"
                      : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400">{c.short_sha}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        c.is_conventional ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {c.is_conventional ? "Conventional" : "Substandard"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold truncate text-white">{c.message}</p>
                    <p className="text-[11px] text-slate-400">by @{c.author}</p>
                  </div>
                  <input
                    type="radio"
                    name="selectedCommit"
                    checked={selectedSha === c.sha}
                    onChange={() => setSelectedSha(c.sha)}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400">
              {loadingCommits ? "Fetching recent repository commits..." : "Enter a repository URL above to load recent commits."}
            </div>
          )}

          <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleAnalyzeHistoryCommit()}
              disabled={loading || !selectedSha}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? "Analyzing Changed Files..." : "⚡ Analyze Changed Files & Synthesize"}
            </button>
          </div>
        </div>
      )}

      {/* Synthesized Output Result Card */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Improved Conventional Commit
              </span>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="text-lg lg:text-xl font-mono font-bold text-white">
                  {result.conventional_message || result.improved_title}
                </span>
                <span className="text-xs bg-blue-500/10 text-blue-400 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono">
                  {result.type}
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                  scope: {result.scope}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleCopy(result.conventional_message || result.improved_title)}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition shrink-0"
            >
              {copied ? "✓ Copied!" : "📋 Copy Title"}
            </button>
          </div>

          {/* Changed Files (If from history analysis) */}
          {result.changed_files && result.changed_files.length > 0 && (
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Analyzed Files ({result.total_files_changed} changed)
                </span>
                <span className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">+{result.additions}</span> / <span className="text-rose-400 font-bold">-{result.deletions}</span> lines
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.changed_files.map((file, idx) => (
                  <code key={idx} className="text-xs bg-slate-900 text-slate-300 px-2.5 py-1 rounded-md border border-slate-800 font-mono">
                    {file}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Copyable Terminal Git Command */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Ready-to-Paste Terminal Command
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <code className="text-xs font-mono text-emerald-400 overflow-x-auto select-all">
                {result.git_command}
              </code>
              <button
                onClick={() => handleCopy(result.git_command)}
                className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white px-4 py-2 rounded-lg transition shrink-0 border border-slate-700"
              >
                Copy Command
              </button>
            </div>
          </div>

          {/* Checklist */}
          {result.checklist && (
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                SCM Traceability Verification
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {result.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
