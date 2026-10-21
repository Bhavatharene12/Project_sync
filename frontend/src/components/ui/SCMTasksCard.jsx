import { useState } from "react";
import { useSCM } from "../../context/SCMContext";

function SCMTasksCard({ tasks = [] }) {
  const { openToolModal } = useSCM();
  const [approvedTasks, setApprovedTasks] = useState({});

  const toggleApproval = (taskId) => {
    setApprovedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const executeTask = (task) => {
    if (task.task_type === "generate_readme") {
      openToolModal("README");
    } else if (task.task_type === "create_release_notes") {
      openToolModal("RELEASE");
    } else if (task.task_type === "scaffold_ci_workflow") {
      openToolModal("WORKFLOW");
    } else {
      openToolModal("BRANCH");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📋</span> Priority SCM Tasks ({tasks.length})
        </h2>
        <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20 font-mono">
          Approval Engine
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Approve and execute automated tasks to remediate detected configuration issues.
      </p>

      {tasks.length === 0 ? (
        <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
          <p className="text-sm font-semibold text-slate-300">No pending automation tasks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isApproved = approvedTasks[task.id];
            return (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(isApproved)}
                    onChange={() => toggleApproval(task.id)}
                    className="mt-1 w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{task.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {task.task_type}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => executeTask(task)}
                    className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                      isApproved
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                  >
                    {isApproved ? "⚡ Execute Task" : "Preview & Run"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SCMTasksCard;
