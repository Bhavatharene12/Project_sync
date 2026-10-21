import { useState } from "react";
import { useSCM } from "../../context/SCMContext";

function ExecutionHistoryPage() {
  const {
    timeline,
    timelineLoading,
    fetchTimeline,
    handleClearTimeline
  } = useSCM();

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = timeline.filter(entry => {
    const matchesStatus = filterStatus === "ALL" || entry.status === filterStatus;
    const matchesSearch =
      (entry.summary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.action_type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.repository || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.commit_sha || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(timeline, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sync-scm-activity-timeline-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    let md = "# Sync SCM Execution Activity Audit Trail\n\n";
    md += `*Generated on ${new Date().toUTCString()}*\n\n`;
    md += "| Timestamp | Action | Status | Repository | Summary | Commit SHA |\n";
    md += "|---|---|---|---|---|---|\n";
    timeline.forEach(e => {
      md += `| ${e.timestamp} | ${e.action_type} | ${e.status} | ${e.repository} | ${e.summary} | ${e.commit_sha || "N/A"} |\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sync-scm-activity-timeline-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              <h1 className="text-xl font-bold text-white tracking-wide">
                SCM Activity Timeline & Audit Trail
              </h1>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Persistent chronological record of all approved and executed SCM changes, commit receipts, and automated GitHub operations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={timeline.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl border border-slate-700 transition disabled:opacity-50"
            >
              Export JSON
            </button>
            <button
              onClick={handleExportMarkdown}
              disabled={timeline.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl border border-slate-700 transition disabled:opacity-50"
            >
              Export Markdown
            </button>
            <button
              onClick={fetchTimeline}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              Refresh ↻
            </button>
            {timeline.length > 0 && (
              <button
                onClick={handleClearTimeline}
                className="bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs px-3 py-2 rounded-xl transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {["ALL", "SUCCESS", "SIMULATED", "REJECTED"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search timeline..."
          className="bg-slate-950 border border-slate-700 text-xs px-3 py-1.5 rounded-lg text-white placeholder-slate-500 outline-none w-64 focus:border-blue-500"
        />
      </div>

      {/* Timeline List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        {timelineLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading activity timeline...
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 py-2">
            {filteredEntries.map((entry, idx) => {
              const isSuccess = entry.status === "SUCCESS";
              const isSimulated = entry.status === "SIMULATED";

              return (
                <div key={idx} className="relative pl-6">
                  {/* Timeline Node Icon */}
                  <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] ${
                    isSuccess
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : isSimulated
                      ? "bg-blue-500 text-slate-950 font-bold"
                      : "bg-rose-500 text-slate-950 font-bold"
                  }`}>
                    {isSuccess ? "✓" : isSimulated ? "⚡" : "✕"}
                  </span>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-xs">{entry.summary}</strong>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                          {entry.action_type}
                        </span>
                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                          isSuccess
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : isSimulated
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {entry.status}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-400 flex flex-wrap items-center gap-4">
                      <span>Repo: <strong className="text-slate-300 font-mono">{entry.repository}</strong></span>
                      {entry.commit_sha && (
                        <span>Commit: <code className="bg-slate-900 px-1 rounded text-blue-400 font-mono">{entry.commit_sha}</code></span>
                      )}
                      <span>Operator: <strong className="text-slate-300">{entry.operator}</strong></span>
                    </div>

                    {entry.verification_message && (
                      <div className="mt-2 text-[11px] bg-slate-900/60 p-2 rounded text-slate-300 font-mono border border-slate-800/80">
                        🔍 {entry.verification_message}
                      </div>
                    )}

                    {entry.resource_url && (
                      <div className="mt-2">
                        <a
                          href={entry.resource_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium"
                        >
                          View Resource on GitHub ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs italic">
            No activity records found matching criteria. Execute approved tasks in the Action Center or Execution Center to build your audit timeline.
          </div>
        )}
      </div>
    </div>
  );
}

export default ExecutionHistoryPage;
