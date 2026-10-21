import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";

function ActionCenterPage() {
  const navigate = useNavigate();
  const {
    auditData,
    openToolModal,
    getSmartChecklist,
    toggleChecklistItem,
    executionHistory,
    clearHistory,
  } = useSCM();

  const [filterPriority, setFilterPriority] = useState("ALL"); // ALL | CRITICAL | WARNING | INFO | PENDING | COMPLETED
  const [sortBy, setSortBy] = useState("PRIORITY"); // PRIORITY | TIME | CATEGORY
  const [taskStatusOverrides, setTaskStatusOverrides] = useState({});

  const isScanned = Boolean(auditData);
  const repoName = auditData?.metadata?.name || "Repository";
  const owner = auditData?.metadata?.owner?.login || "Owner";

  // Synthesize recommendations into actionable tasks
  const rawTasks = useMemo(() => {
    if (!auditData) return [];

    const tasks = [
      {
        id: "ACT-DOC-01",
        priority: "WARNING",
        category: "Documentation",
        problem: "README is missing critical setup and architecture sections",
        fixTitle: "Generate Enterprise README",
        estTime: "30 sec",
        toolType: "README",
        rationale: "Comprehensive documentation decreases onboarding time and prevents repetitive issues."
      },
      {
        id: "ACT-REL-01",
        priority: (auditData.release_audit?.total_releases || 0) === 0 ? "CRITICAL" : "INFO",
        category: "Releases",
        problem: (auditData.release_audit?.total_releases || 0) === 0 ? "No formal releases or version tag baselines" : "Release notes and SemVer tracking",
        fixTitle: "Synthesize Release Plan v1.0.0",
        estTime: "2 min",
        toolType: "RELEASE",
        rationale: "Software Configuration Management requires distinct version baselines for traceability."
      },
      {
        id: "ACT-BR-01",
        priority: (auditData.branches?.total_branches || 1) === 1 ? "WARNING" : "INFO",
        category: "Branching",
        problem: (auditData.branches?.total_branches || 1) === 1 ? "Single branch detected (No feature branching)" : "Branch protection & naming hygiene",
        fixTitle: "Generate SCM Branch Strategy",
        estTime: "45 sec",
        toolType: "BRANCH",
        rationale: "Isolates development into feature branches and establishes branch protection on main."
      },
      {
        id: "ACT-CI-01",
        priority: (auditData.workflow_audit?.total_workflows || 0) === 0 ? "WARNING" : "INFO",
        category: "CI/CD",
        problem: (auditData.workflow_audit?.total_workflows || 0) === 0 ? "No automated GitHub Actions CI pipeline configured" : "Continuous integration verification",
        fixTitle: "Generate CI Workflow YAML",
        estTime: "1 min",
        toolType: "WORKFLOW",
        rationale: "Runs automated test suites, linters, and build verification on push and pull requests."
      },
      {
        id: "ACT-CMT-01",
        priority: (auditData.commits_audit?.conventional_commit_rate || 0) < 60 ? "WARNING" : "INFO",
        category: "Commits",
        problem: `Only ${Math.round(auditData.commits_audit?.conventional_commit_rate || 0)}% Conventional Commits compliance`,
        fixTitle: "Rewrite Commits & Generate Guide",
        estTime: "20 sec",
        toolType: "COMMIT",
        rationale: "Standardizes commit formatting and enables automated semantic versioning and changelogs."
      },
      {
        id: "ACT-IMP-01",
        priority: "INFO",
        category: "Risk & Impact",
        problem: "Unassessed module change volatility & merge conflict risks",
        fixTitle: "Run Change Impact Analysis",
        estTime: "15 sec",
        toolType: "IMPACT",
        rationale: "Assesses branch divergence, impacted entrypoints, and merge conflict probability."
      }
    ];

    return tasks;
  }, [auditData]);

  // Apply state overrides
  const tasksWithState = useMemo(() => {
    return rawTasks.map(t => ({
      ...t,
      status: taskStatusOverrides[t.id] || "PENDING" // PENDING | RUNNING | COMPLETED | DISMISSED | APPROVED
    }));
  }, [rawTasks, taskStatusOverrides]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasksWithState.filter(t => {
      if (filterPriority === "ALL") return t.status !== "DISMISSED";
      if (filterPriority === "PENDING") return t.status === "PENDING" || t.status === "APPROVED";
      if (filterPriority === "COMPLETED") return t.status === "COMPLETED";
      return t.priority === filterPriority && t.status !== "DISMISSED";
    });
  }, [tasksWithState, filterPriority]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const priorityWeight = { CRITICAL: 3, WARNING: 2, INFO: 1 };
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === "PRIORITY") {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === "TIME") {
        return a.estTime.localeCompare(b.estTime);
      }
      if (sortBy === "CATEGORY") {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });
  }, [filteredTasks, sortBy]);

  const setTaskState = (taskId, newStatus) => {
    setTaskStatusOverrides(prev => ({
      ...prev,
      [taskId]: newStatus
    }));
  };

  const handleRunTask = (task) => {
    setTaskState(task.id, "COMPLETED");
    openToolModal(task.toolType);
  };

  const smartChecklist = getSmartChecklist();
  const completedChecklistCount = smartChecklist.filter(c => c.completed).length;
  const checklistPercentage = smartChecklist.length > 0 ? Math.round((completedChecklistCount / smartChecklist.length) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <h1 className="text-3xl font-black text-white tracking-tight">
              SCM Action Center
            </h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
              Automation Hub
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Turn detected SCM issues into actionable, executable workflows. Run, simulate, and apply automated fixes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/actions")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-1.5"
          >
            <span>🛠️</span>
            <span>Real GitHub Execution</span>
          </button>
          <button
            onClick={() => openToolModal("EXPORT")}
            disabled={!isScanned}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition border border-slate-700 disabled:opacity-40"
          >
            📦 Export Bundle
          </button>
          <button
            onClick={() => navigate("/repository-scan")}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition border border-slate-700"
          >
            {isScanned ? "Scan Different Repo" : "Scan Repository"}
          </button>
        </div>
      </div>

      {!isScanned ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            ⚡
          </div>
          <h2 className="text-xl font-bold text-white">Action Center Awaiting Target Repository</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 mb-6">
            Scan a repository to automatically populate executable SCM tasks, simulation workflows, and release baselines.
          </p>
          <button
            onClick={() => navigate("/repository-scan")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            Scan Repository to Load Actions →
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Module 8: Smart SCM Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>✅</span> Smart SCM Configuration Checklist
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live completion progress for <strong>{owner}/{repoName}</strong>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-blue-400 font-mono">
                  {completedChecklistCount}/{smartChecklist.length}
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 font-semibold">
                  {checklistPercentage}% Complete
                </span>
              </div>
            </div>

            {/* Checklist Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-6">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-700"
                style={{ width: `${checklistPercentage}%` }}
              ></div>
            </div>

            {/* Checklist Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {smartChecklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 select-none ${
                    item.completed
                      ? "bg-emerald-950/20 border-emerald-800/60 hover:bg-emerald-950/30"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span className="text-base mt-0.5">
                    {item.completed ? "✅" : "⭕"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold block truncate ${item.completed ? "text-emerald-300" : "text-white"}`}>
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                      {item.desc}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openToolModal(item.actionType);
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-2 py-0.5 rounded border border-slate-700 transition"
                  >
                    Fix
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Module 1: SCM Action Center Command Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Executable SCM Task Queue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a workflow to simulate, generate artifacts, or prepare GitHub PRs.
                </p>
              </div>

              {/* Filters & Sort Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  {["ALL", "CRITICAL", "WARNING", "INFO", "PENDING", "COMPLETED"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterPriority(f)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition ${
                        filterPriority === f
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-950 text-slate-300 text-xs border border-slate-800 rounded-xl px-3 py-1.5 outline-none"
                >
                  <option value="PRIORITY">Sort: Priority</option>
                  <option value="TIME">Sort: Est. Time</option>
                  <option value="CATEGORY">Sort: Category</option>
                </select>
              </div>
            </div>

            {/* Task Cards List */}
            <div className="space-y-3">
              {sortedTasks.length === 0 ? (
                <div className="p-8 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
                  No tasks matching the selected filter.
                </div>
              ) : (
                sortedTasks.map((task) => {
                  const isCritical = task.priority === "CRITICAL";
                  const isWarning = task.priority === "WARNING";
                  const badgeColor = isCritical
                    ? "bg-red-950 text-red-400 border-red-800"
                    : isWarning
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : "bg-blue-950 text-blue-400 border-blue-800";

                  const isApproved = task.status === "APPROVED";
                  const isCompleted = task.status === "COMPLETED";

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCompleted
                          ? "bg-slate-950/40 border-slate-800/80 opacity-75"
                          : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 mt-0.5 ${badgeColor}`}>
                          {task.priority}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {task.category}
                            </span>
                            <h4 className="text-sm font-semibold text-white">
                              {task.fixTitle}
                            </h4>
                            {isApproved && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                                ✓ Approved
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{task.problem}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{task.rationale}</p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                          ⏱ {task.estTime}
                        </span>

                        <button
                          onClick={() => setTaskState(task.id, isApproved ? "PENDING" : "APPROVED")}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                            isApproved
                              ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          }`}
                        >
                          {isApproved ? "Approved" : "Approve"}
                        </button>

                        <button
                          onClick={() => handleRunTask(task)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                        >
                          <span>⚡</span>
                          <span>Run</span>
                        </button>

                        <button
                          onClick={() => setTaskState(task.id, "DISMISSED")}
                          className="text-slate-500 hover:text-red-400 text-xs px-2 py-1.5 transition"
                          title="Dismiss task"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Module 9: Execution History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📜</span> Local SCM Execution History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record of all generated workflows, READMEs, release notes, and strategy policies.
                </p>
              </div>

              {executionHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-slate-400 hover:text-red-400 underline transition"
                >
                  Clear History
                </button>
              )}
            </div>

            {executionHistory.length === 0 ? (
              <div className="p-8 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
                No recorded executions yet. Run an action from the task queue above to save its generated output.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Repository</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Summary</th>
                      <th className="p-3 text-right">Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {executionHistory.slice(0, 10).map((hist) => (
                      <tr key={hist.id} className="hover:bg-slate-950/50">
                        <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 font-semibold text-white">{hist.title}</td>
                        <td className="p-3 font-mono text-blue-400">{hist.repo}</td>
                        <td className="p-3">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300">
                            {hist.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs truncate">{hist.summary}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              if (hist.category === "Documentation") openToolModal("README");
                              else if (hist.category === "Branching") openToolModal("BRANCH");
                              else if (hist.category === "Releases") openToolModal("RELEASE");
                              else if (hist.category === "Commits") openToolModal("COMMIT");
                              else if (hist.category === "Automation") openToolModal("WORKFLOW");
                              else if (hist.category === "Impact") openToolModal("IMPACT");
                              else openToolModal("REPORT");
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-2.5 py-1 rounded text-xs font-medium transition"
                          >
                            Reopen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionCenterPage;
