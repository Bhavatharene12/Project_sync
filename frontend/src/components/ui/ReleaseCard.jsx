function ReleaseCard({ releaseAudit }) {
  if (!releaseAudit) return null;

  const totalReleases = releaseAudit.total_releases ?? 0;
  const totalTags = releaseAudit.total_tags ?? 0;
  const semverRate = releaseAudit.semver_compliance_rate ?? 0;
  const status = releaseAudit.status || "N/A";
  const findings = releaseAudit.findings || [];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🏷️</span> Release Baselines & SemVer
          </h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
            {status}
          </span>
        </div>

        <div className="mb-4">
          <h1 className="text-4xl font-black text-purple-400">
            {semverRate}%
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Semantic Versioning (SemVer) Tag Adherence
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Formal Releases</span>
            <span className="font-bold text-white text-sm">{totalReleases}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Git Version Tags</span>
            <span className="font-bold text-white text-sm">{totalTags}</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Release Findings
          </h4>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc ml-4">
            {findings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ReleaseCard;
