import { useNavigate } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";
import ReadmeCard from "../../components/ui/ReadmeCard";

function DocumentationPage() {
  const navigate = useNavigate();
  const { auditData, legacyScanData, openToolModal } = useSCM();

  const isScanned = Boolean(auditData);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>📖</span> Documentation & README Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Evaluate README coverage, section completeness, and auto-scaffold missing developer guides.
          </p>
        </div>
        <div className="flex gap-3">
          {isScanned && (
            <button
              onClick={() => openToolModal("README")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <span>📄</span>
              <span>Scaffold README</span>
            </button>
          )}
          <button
            onClick={() => navigate("/repository-scan")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
          >
            {isScanned ? "Scan Another Repo" : "Scan Repository"}
          </button>
        </div>
      </div>

      {!isScanned ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <span className="text-5xl block mb-3">📖</span>
          <h3 className="text-lg font-bold text-white">No Documentation Data Available</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Please scan a GitHub repository to evaluate its README sections, license disclosures, and contribution guidelines.
          </p>
          <button
            onClick={() => navigate("/repository-scan")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
          >
            Go to Scanner →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <ReadmeCard repoData={legacyScanData} />

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-2">📋 Essential SCM Documentation Checklist</h3>
            <p className="text-xs text-slate-400 mb-4">
              A professional open-source or commercial repository requires 5 baseline sections for effective configuration management.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Installation Guide</h4>
                  <p className="text-slate-400 text-[11px]">Clear dependency commands and runtime prerequisites.</p>
                </div>
                <span className="text-lg">
                  {auditData.readme?.strengths?.some(s => s.toLowerCase().includes("install")) ? "✅" : "❌"}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Usage & Quickstart</h4>
                  <p className="text-slate-400 text-[11px]">Step-by-step code samples and CLI commands.</p>
                </div>
                <span className="text-lg">
                  {auditData.readme?.strengths?.some(s => s.toLowerCase().includes("usage")) ? "✅" : "❌"}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Features Overview</h4>
                  <p className="text-slate-400 text-[11px]">Summary of software capabilities and modules.</p>
                </div>
                <span className="text-lg">
                  {auditData.readme?.strengths?.some(s => s.toLowerCase().includes("feature")) ? "✅" : "❌"}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">License Disclosure</h4>
                  <p className="text-slate-400 text-[11px]">Explicit copyright and open source terms (MIT, Apache).</p>
                </div>
                <span className="text-lg">
                  {auditData.readme?.strengths?.some(s => s.toLowerCase().includes("license")) ? "✅" : "❌"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentationPage;
