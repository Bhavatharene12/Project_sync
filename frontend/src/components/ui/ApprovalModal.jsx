import { useState } from "react";
import { useSCM } from "../../context/SCMContext";

function ApprovalModal() {
  const {
    activeApprovalPlan,
    closeApprovalModal,
    handleApprovePlan,
    handleRejectPlan,
    planExecutionResult,
    approving
  } = useSCM();

  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!activeApprovalPlan) return null;

  const plan = activeApprovalPlan;
  const isDone = !!planExecutionResult;

  const getImpactBadge = (level) => {
    switch ((level || "MEDIUM").toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  const onApprove = async () => {
    await handleApprovePlan(plan.plan_id);
  };

  const onReject = async () => {
    await handleRejectPlan(plan.plan_id, rejectReason || "Rejected by user in execution center");
    setRejectMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-t-4 border-t-blue-500">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${getImpactBadge(plan.impact_level)}`}>
                Impact: {plan.impact_level}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {plan.plan_id}
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                {plan.repository}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-2">
              {plan.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {plan.description}
            </p>
          </div>

          <button
            onClick={closeApprovalModal}
            className="text-slate-400 hover:text-white p-1 text-lg rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Post-execution Receipt */}
          {isDone && (
            <div className={`p-4 rounded-xl border ${
              planExecutionResult.status === "SUCCESS"
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                : planExecutionResult.status === "SIMULATED"
                ? "bg-blue-950/30 border-blue-500/40 text-blue-300"
                : "bg-rose-950/30 border-rose-500/40 text-rose-300"
            }`}>
              <div className="flex items-center gap-2 font-bold text-base">
                <span>{planExecutionResult.status === "SUCCESS" ? "✓" : "⚡"}</span>
                <span>Execution Status: {planExecutionResult.status}</span>
              </div>
              <p className="text-xs mt-1 text-slate-300">
                {planExecutionResult.summary}
              </p>
              {planExecutionResult.verification_message && (
                <div className="mt-2 text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800 font-mono">
                  🔍 <strong>Verification:</strong> {planExecutionResult.verification_message}
                </div>
              )}
              {planExecutionResult.commit_sha && (
                <div className="mt-2 text-xs flex items-center gap-2">
                  <span className="text-slate-400">Commit SHA:</span>
                  <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 font-mono">
                    {planExecutionResult.commit_sha}
                  </code>
                </div>
              )}
              {planExecutionResult.resource_url && (
                <div className="mt-2">
                  <a
                    href={planExecutionResult.resource_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 font-medium"
                  >
                    View resource on GitHub →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Diff / Changes Preview */}
          {plan.diff && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Proposed Changes / Diff Preview
                </h4>
                {plan.diff.additions_count !== undefined && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-emerald-400">+{plan.diff.additions_count}</span>
                    <span className="text-rose-400">-{plan.diff.deletions_count}</span>
                  </div>
                )}
              </div>

              {plan.diff.unified_diff ? (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-56 leading-relaxed">
                  {plan.diff.unified_diff.split("\n").map((line, idx) => {
                    let color = "text-slate-300";
                    if (line.startsWith("+") && !line.startsWith("+++")) color = "text-emerald-400 bg-emerald-950/20";
                    else if (line.startsWith("-") && !line.startsWith("---")) color = "text-rose-400 bg-rose-950/20";
                    else if (line.startsWith("@")) color = "text-blue-400 font-bold";
                    return (
                      <div key={idx} className={`${color} px-1 rounded-sm whitespace-pre`}>
                        {line}
                      </div>
                    );
                  })}
                </div>
              ) : plan.diff.yaml_preview ? (
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-56 text-slate-300">
                  {plan.diff.yaml_preview}
                </pre>
              ) : plan.diff.changelog_preview ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {plan.diff.changelog_preview}
                </div>
              ) : plan.diff.items ? (
                <div className="space-y-2">
                  {plan.diff.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-white">{item.title}</strong>
                        <p className="text-slate-400 text-[11px] mt-0.5">{item.description}</p>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  {JSON.stringify(plan.diff, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Rollback Strategy */}
          {plan.rollback_strategy && (
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs">
              <span className="text-base text-amber-400">🛡️</span>
              <div>
                <strong className="text-slate-300 font-medium">Safe Rollback Guarantee:</strong>
                <p className="text-slate-400 mt-0.5">{plan.rollback_strategy}</p>
              </div>
            </div>
          )}

          {/* Rejection input */}
          {rejectMode && (
            <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl">
              <label className="block text-xs font-semibold text-rose-300 mb-1">
                Reason for Rejection / Cancellation:
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Schedule for next release sprint or revise changes..."
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-rose-400"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={closeApprovalModal}
            className="text-xs text-slate-400 hover:text-white px-3 py-2 transition"
          >
            {isDone ? "Close" : "Dismiss"}
          </button>

          {!isDone ? (
            <div className="flex items-center gap-3">
              {!rejectMode ? (
                <>
                  <button
                    onClick={() => setRejectMode(true)}
                    disabled={approving}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-3.5 py-2 rounded-lg border border-rose-500/30 transition disabled:opacity-50"
                  >
                    Reject Plan
                  </button>
                  <button
                    onClick={onApprove}
                    disabled={approving}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {approving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Executing on GitHub...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Approve & Execute via GitHub API</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setRejectMode(false)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-2"
                  >
                    Back
                  </button>
                  <button
                    onClick={onReject}
                    disabled={approving}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    Confirm Rejection
                  </button>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={closeApprovalModal}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApprovalModal;
