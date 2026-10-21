function CommitCard({ commitsAudit }) {
  if (!commitsAudit) return null;

  const rate = commitsAudit.conventional_commit_rate ?? 0;
  const status = commitsAudit.status || "N/A";
  const inspected = commitsAudit.total_inspected ?? 0;
  const authors = commitsAudit.distinct_authors ?? 0;
  const findings = commitsAudit.findings || [];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💬</span> Commit Quality & Conventions
          </h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
            {status}
          </span>
        </div>

        <div className="mb-4">
          <h1 className="text-4xl font-black text-cyan-400">
            {rate}%
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conventional Commits Compliance
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Inspected</span>
            <span className="font-bold text-white text-sm">{inspected} commits</span>
          </div>
          <div>
            <span className="text-slate-400 block">Distinct Authors</span>
            <span className="font-bold text-white text-sm">{authors}</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            SCM Findings
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

export default CommitCard;
