import { useSCM } from "../../context/SCMContext";

function SCMMaturityDashboard() {
  const { auditData, scmMaturityScore } = useSCM();

  if (!auditData) return null;

  const healthScore = auditData.health?.score ?? 0;
  const readmeScore = auditData.readme?.score ?? 0;
  const branchScore = auditData.branches?.score ?? 0;
  const commitScore = Math.round(auditData.commits_audit?.conventional_commit_rate ?? 0);
  const releaseScore = Math.round(
    auditData.release_audit?.total_releases > 0
      ? Math.max(auditData.release_audit?.semver_compliance_rate ?? 50, 60)
      : (auditData.release_audit?.total_tags > 0 ? 50 : 20)
  );
  const workflowScore = Math.round(
    auditData.workflow_audit?.total_workflows > 0
      ? (auditData.workflow_audit?.ci_pass_rate || 85)
      : 20
  );

  const dimensions = [
    { name: "Repository Health", score: healthScore, icon: "🧠", status: auditData.health?.health || "N/A" },
    { name: "Documentation", score: readmeScore, icon: "📖", status: auditData.readme?.status || "N/A" },
    { name: "Branch Management", score: branchScore, icon: "🌿", status: auditData.branches?.status || "N/A" },
    { name: "Commit Quality", score: commitScore, icon: "💬", status: `${commitScore}% Conventional` },
    { name: "Release Management", score: releaseScore, icon: "🏷️", status: `${auditData.release_audit?.total_releases || 0} Releases` },
    { name: "Workflow Automation", score: workflowScore, icon: "⚡", status: `${auditData.workflow_audit?.total_workflows || 0} Workflows` },
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500";
    if (score >= 60) return "text-blue-400 bg-blue-500";
    if (score >= 40) return "text-amber-400 bg-amber-500";
    return "text-red-400 bg-red-500";
  };

  const getGrade = (score) => {
    if (score >= 90) return { grade: "A+", desc: "Optimal SCM Hygiene" };
    if (score >= 80) return { grade: "A", desc: "Strong SCM Discipline" };
    if (score >= 70) return { grade: "B", desc: "Acceptable SCM Practices" };
    if (score >= 50) return { grade: "C", desc: "Needs Attention" };
    return { grade: "D", desc: "High Risk SCM Debt" };
  };

  const gradeInfo = getGrade(scmMaturityScore);

  // SVG Circular progress radius calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scmMaturityScore / 100) * circumference;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎖️</span>
            <h2 className="text-xl font-bold text-white">SCM Maturity & Health Radar</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Holistic assessment across 6 source configuration management pillars
          </p>
        </div>

        {/* Circular Overall Score Indicator */}
        <div className="flex items-center gap-5 bg-slate-950/70 px-5 py-3 rounded-2xl border border-slate-800 self-start md:self-auto">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black text-white">{scmMaturityScore}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-blue-400">{gradeInfo.grade}</span>
              <span className="text-xs bg-blue-500/10 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
                Grade
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">{gradeInfo.desc}</p>
            <p className="text-[11px] text-slate-400 mt-1">Weighted composite analysis</p>
          </div>
        </div>
      </div>

      {/* 6 Dimension Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dimensions.map((dim) => {
          const colorClass = getScoreColor(dim.score);
          const textColor = colorClass.split(" ")[0];
          const barColor = colorClass.split(" ")[1];

          return (
            <div
              key={dim.name}
              className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>{dim.icon}</span>
                  <span>{dim.name}</span>
                </span>
                <span className={`text-sm font-bold ${textColor}`}>
                  {dim.score}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${barColor} transition-all duration-700`}
                  style={{ width: `${Math.max(dim.score, 4)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Evaluation</span>
                <span className="font-medium text-slate-300">{dim.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SCMMaturityDashboard;
