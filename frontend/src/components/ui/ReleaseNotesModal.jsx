import { useState } from "react";
import { useSCM } from "../../context/SCMContext";

function ReleaseNotesModal() {
  const { releaseNotesModal, closeReleaseNotesModal } = useSCM();
  const [copied, setCopied] = useState(false);

  if (!releaseNotesModal.isOpen) return null;

  const handleCopy = () => {
    if (releaseNotesModal.content) {
      navigator.clipboard.writeText(releaseNotesModal.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!releaseNotesModal.content) return;
    const blob = new Blob([releaseNotesModal.content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "SCM-AUDIT-REPORT.md");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="text-xl font-bold text-white">Generated SCM Release & Audit Report</h3>
              <p className="text-xs text-slate-400">Generated directly from GitHub API metrics & SCM analysis</p>
            </div>
          </div>
          <button
            onClick={closeReleaseNotesModal}
            className="text-slate-400 hover:text-white text-2xl font-bold p-1 leading-none"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-sm">
          {releaseNotesModal.loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-300 font-sans">Generating comprehensive SCM markdown report...</p>
            </div>
          ) : releaseNotesModal.error ? (
            <div className="bg-red-950/50 border border-red-700/50 rounded-xl p-4 text-red-200 font-sans">
              <p className="font-semibold">Error generating report:</p>
              <p className="text-sm mt-1">{releaseNotesModal.error}</p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap bg-slate-950 p-4 rounded-xl text-slate-200 border border-slate-800 leading-relaxed">
              {releaseNotesModal.content}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <p className="text-xs text-slate-400">
            {releaseNotesModal.content ? "Ready for GitHub Release or commit baseline" : ""}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              disabled={!releaseNotesModal.content}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {copied ? "✓ Copied to Clipboard" : "📋 Copy Markdown"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!releaseNotesModal.content}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              ⬇ Download .md
            </button>
            <button
              onClick={closeReleaseNotesModal}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReleaseNotesModal;
