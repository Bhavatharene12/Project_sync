import React, { useState, useEffect } from "react";
import { useSCM } from "../../context/SCMContext";
import { getEssentialsStatus, installEssential } from "../../api/github";

export default function EssentialsPage() {
  const { auditData, githubToken } = useSCM();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [installing, setInstalling] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    const currentUrl =
      auditData?.metadata?.html_url ||
      (auditData?.report?.owner && auditData?.report?.repository
        ? `https://github.com/${auditData.report.owner}/${auditData.report.repository}`
        : "");
    if (currentUrl) {
      setRepoUrl(currentUrl);
      loadStatus(currentUrl);
    }
  }, [auditData]);

  const loadStatus = async (targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getEssentialsStatus(targetUrl, githubToken);
      setData(res);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setError("Repository not found or no public access. Please check the URL format.");
      } else {
        setError(msg || "Failed to load repository essentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (item) => {
    setInstalling(item.path);
    setSuccessNotice(null);
    setError(null);
    try {
      const res = await installEssential(
        repoUrl,
        item.path,
        item.template_content,
        `chore(scm): add ${item.path} template via Sync`,
        null,
        githubToken
      );
      setSuccessNotice(`Successfully committed ${item.path} (SHA: ${res.commit_sha})`);
      loadStatus();
    } catch (err) {
      setError(err.message || `Failed to install ${item.path}.`);
    } finally {
      setInstalling(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📦</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Missing Essentials</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                1-Click Scaffolding
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Detect and automatically commit missing fundamental repository assets (.gitignore, open-source LICENSE, CI workflow, and PR templates) directly to GitHub.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] lg:w-96">
              <input
                type="text"
                placeholder="owner/repo or full GitHub URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadStatus()}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition placeholder-slate-500 font-mono"
              />
            </div>
            <button
              onClick={() => loadStatus()}
              disabled={loading || !repoUrl}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Audit Essentials</span>
                </>
              )}
            </button>
          </div>
        </div>

        {successNotice && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center justify-between">
            <span className="font-medium">✓ {successNotice}</span>
            <button onClick={() => setSuccessNotice(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1">✕</button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Summary Banner */}
      {data && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-2xl border border-slate-800">
              {data.summary.missing === 0 ? "🛡️" : "⚠️"}
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Repository SCM Baseline</span>
              <p className="text-lg font-bold text-white mt-0.5">{data.summary.health_status}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 px-4">
              <span className="text-xs text-slate-400 block font-medium">Configured Files</span>
              <strong className="text-lg font-black text-emerald-400">{data.summary.present} / {data.summary.total}</strong>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 px-4">
              <span className="text-xs text-slate-400 block font-medium">Actionable Missing</span>
              <strong className="text-lg font-black text-rose-400">{data.summary.missing}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Essentials Cards Grid */}
      {data && (
        <div className="grid grid-cols-1 gap-4 lg:gap-5">
          {data.essentials.map((item) => {
            const isMissing = !item.exists;
            const meaningfulStatus = isMissing
              ? `Missing ${item.name.replace(" File", "")}`
              : `${item.name} Configured`;

            return (
              <div
                key={item.id}
                className={`p-6 rounded-2xl border transition-all ${
                  item.exists
                    ? "bg-slate-900/60 border-slate-800"
                    : "bg-slate-900 border-amber-500/40 shadow-sm"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xl">{item.exists ? "✅" : "⚠️"}</span>
                      <h3 className="text-base font-bold text-white">{meaningfulStatus}</h3>
                      <code className="text-xs bg-slate-950 px-2.5 py-1 rounded-md text-blue-400 border border-slate-800 font-mono">
                        {item.path}
                      </code>
                      <span
                        className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                          item.importance === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {item.importance}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-400 leading-relaxed pl-8 lg:pl-0">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pl-8 lg:pl-0 shrink-0">
                    <button
                      onClick={() => setPreviewItem(previewItem === item.id ? null : item.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
                    >
                      {previewItem === item.id ? "Hide Template" : "Preview Template"}
                    </button>

                    {isMissing ? (
                      <button
                        onClick={() => handleInstall(item)}
                        disabled={installing === item.path}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-600/20"
                      >
                        {installing === item.path ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>Committing...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡</span>
                            <span>1-Click Install</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        Active in repo ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Template Preview Drawer */}
                {previewItem === item.id && (
                  <div className="mt-5 pt-5 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Template Preview ({item.path})
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.template_content);
                          alert("Template copied to clipboard!");
                        }}
                        className="text-xs text-blue-400 hover:underline font-medium"
                      >
                        Copy Raw Template
                      </button>
                    </div>
                    <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-64">
                      {item.template_content}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
