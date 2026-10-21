import { useNavigate } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";

function RepositoryDoctor() {
  const navigate = useNavigate();
  const { auditData } = useSCM();

  // If no repository scanned yet, display empty state
  if (!auditData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🩺</span> Repository Doctor
            </h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700">
              Awaiting Audit
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Repository Doctor runs automated rule-based diagnostics across documentation, branching, commit conventions, releases, and CI/CD workflows.
          </p>

          <div className="my-8 py-8 px-6 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-center">
            <span className="text-4xl inline-block mb-3">🔍</span>
            <h3 className="text-base font-semibold text-white">No Active Repository Audit</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Scan a GitHub repository to evaluate live health rules, detect configuration issues, and receive remediation advice.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/repository-scan")}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/20"
        >
          <span>🔍</span>
          <span>Scan a Repository to Begin</span>
        </button>
      </div>
    );
  }

  // Derive actual live SCM diagnostics from auditData
  const problems = auditData.report?.problems || [];
  const readme = auditData.readme || {};
  const branches = auditData.branches || {};
  const commits = auditData.commits_audit || {};
  const releases = auditData.release_audit || {};
  const workflows = auditData.workflow_audit || {};

  // Build live diagnostic items
  const diagnosticChecks = [
    // 1. README check
    {
      id: "doc-check",
      title: readme.score >= 70 ? "README documentation is comprehensive" : (readme.improvements?.[0] || "README requires documentation improvements"),
      severity: readme.score >= 85 ? "healthy" : (readme.score >= 60 ? "warning" : "critical"),
      statusLabel: readme.status || (readme.score >= 70 ? "Healthy" : "Needs Review"),
      explanation: readme.score >= 70
        ? `Found ${readme.strengths?.length || 0} documented standard sections (Score: ${readme.score}%).`
        : `README score is ${readme.score}%. Missing critical sections.`,
      suggestedFix: readme.improvements?.length
        ? `Add missing sections: ${readme.improvements.slice(0, 2).join("; ")}.`
        : "Documentation satisfies baseline SCM recommendations."
    },
    // 2. Branch structure check
    {
      id: "branch-check",
      title: branches.total_branches > 1 ? `Repository uses feature branching (${branches.total_branches} branches)` : "Single branch detected (No feature branching)",
      severity: branches.total_branches > 1 ? "healthy" : "warning",
      statusLabel: branches.status || "Healthy",
      explanation: branches.suggestions?.[0] || `Default branch is '${auditData.metadata?.default_branch || "main"}'.`,
      suggestedFix: branches.total_branches === 1
        ? "Implement a Gitflow or GitHub flow model with topic branches (feat/*, fix/*)."
        : "Maintain regular branch cleanup and pruning for merged pull requests."
    },
    // 3. Commit hygiene check
    {
      id: "commit-check",
      title: `${commits.conventional_commit_rate ?? 0}% Conventional Commits compliance`,
      severity: (commits.conventional_commit_rate ?? 0) >= 70 ? "healthy" : ((commits.conventional_commit_rate ?? 0) >= 40 ? "warning" : "critical"),
      statusLabel: commits.status || "Review",
      explanation: (commits.conventional_commit_rate ?? 0) >= 70
        ? "Commit messages clearly communicate intent and enable automated changelogs."
        : "Commit messages deviate from structured standards (feat:, fix:, chore:).",
      suggestedFix: "Enforce a commit message linter (commitlint) in git commit hooks or CI."
    },
    // 4. CI/CD automation check
    {
      id: "ci-check",
      title: (workflows.total_workflows ?? 0) > 0 ? `${workflows.active_workflows ?? workflows.total_workflows} active GitHub Actions workflow(s)` : "No CI/CD pipeline configured",
      severity: (workflows.total_workflows ?? 0) > 0 ? "healthy" : "warning",
      statusLabel: (workflows.total_workflows ?? 0) > 0 ? "Healthy" : "Missing CI",
      explanation: (workflows.total_workflows ?? 0) > 0
        ? `CI pipeline pass rate is ${workflows.ci_pass_rate ?? 100}%.`
        : "No automated tests, builds, or lint checks run on commit/PR.",
      suggestedFix: "Configure .github/workflows/ci.yml with automated testing on pull request."
    },
    // 5. Release tracking check
    {
      id: "release-check",
      title: (releases.total_releases ?? 0) > 0 ? `Formal releases published (${releases.total_releases} total)` : "No formal GitHub releases or milestones",
      severity: (releases.total_releases ?? 0) > 0 ? "healthy" : "info",
      statusLabel: releases.status || "Informational",
      explanation: (releases.total_releases ?? 0) > 0
        ? `SemVer tagging compliance: ${releases.semver_compliance_rate ?? 0}%.`
        : "Project lacks formal version tag baselines for configuration tracking.",
      suggestedFix: "Publish tagged releases (v1.0.0) with changelogs for reproducible baselines."
    }
  ];

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return {
          icon: "❌",
          badge: "bg-red-950/80 text-red-400 border-red-800",
          accent: "text-red-400"
        };
      case "warning":
        return {
          icon: "⚠️",
          badge: "bg-amber-950/80 text-amber-400 border-amber-800",
          accent: "text-amber-400"
        };
      case "healthy":
      default:
        return {
          icon: "✅",
          badge: "bg-emerald-950/80 text-emerald-400 border-emerald-800",
          accent: "text-emerald-400"
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🩺</span>
            <h2 className="text-xl font-bold text-white">Repository Doctor</h2>
          </div>
          <span className="text-xs bg-blue-500/10 text-blue-400 font-mono px-2.5 py-1 rounded-full border border-blue-500/20">
            {auditData.metadata?.name || "Repository"} • {problems.length} Problem(s)
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          Real-time SCM rule inspection evaluating documentation, branching strategy, commit conventions, and CI/CD pipelines.
        </p>

        <div className="space-y-3.5">
          {diagnosticChecks.map((check) => {
            const style = getSeverityBadge(check.severity);
            return (
              <div
                key={check.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-tight mt-0.5">{style.icon}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{check.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{check.explanation}</p>
                      <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5">
                        <strong className="text-blue-400">💡 Suggested Fix:</strong>
                        <span>{check.suggestedFix}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${style.badge}`}>
                    {check.statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Evaluated via Sync Heuristic & SCM Engine
        </span>
        <button
          onClick={() => navigate("/repository-scan")}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          Run New Scan
        </button>
      </div>
    </div>
  );
}

export default RepositoryDoctor;