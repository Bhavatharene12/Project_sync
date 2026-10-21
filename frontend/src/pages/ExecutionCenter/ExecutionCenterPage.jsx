import { useState, useEffect, useCallback } from "react";
import { useSCM } from "../../context/SCMContext";
import {
  planReadmeUpdate,
  listBranchesExtended,
  planBranchAction,
  listPRsExtended,
  planPRMerge,
  listIssuesCategorized,
  planIssueAction,
  planReleasePublish,
  listWorkflowsExtended,
  planWorkflowCommit,
  planCleanupBundle
} from "../../api/github";

function ExecutionCenterPage() {
  const {
    auditData,
    githubToken,
    openApprovalModal,
    stagedPlans,
    fetchPlans,
    error,
    setError
  } = useSCM();

  const [activeTab, setActiveTab] = useState("cleanup"); // cleanup | readme | branches | prs | issues | release | workflows
  const [loading, setLoading] = useState(false);
  const [branchesList, setBranchesList] = useState([]);
  const [prsList, setPrsList] = useState([]);
  const [issuesList, setIssuesList] = useState([]);
  const [workflowsList, setWorkflowsList] = useState([]);

  // Form states
  const [newBranchName, setNewBranchName] = useState("");
  const [renameTarget, setRenameTarget] = useState("");
  const [renameBranchName, setRenameBranchName] = useState("");
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueBody, setNewIssueBody] = useState("");
  const [newIssueLabel, setNewIssueLabel] = useState("bug");
  const [releaseTag, setReleaseTag] = useState("auto");
  const [wfFilename, setWfFilename] = useState("ci.yml");
  const [wfContent, setWfContent] = useState("");

  const repoSlug = auditData ? `${auditData.metadata?.owner?.login || auditData.report?.owner}/${auditData.metadata?.name || auditData.report?.repository}` : null;

  // Load contextual data based on active tab
  useEffect(() => {
    let ignore = false;
    const fetchTabData = async () => {
      if (!repoSlug) return;
      try {
        if (activeTab === "branches") {
          const b = await listBranchesExtended(repoSlug, githubToken);
          if (!ignore) setBranchesList(b || []);
        } else if (activeTab === "prs") {
          const p = await listPRsExtended(repoSlug, githubToken);
          if (!ignore) setPrsList(p || []);
        } else if (activeTab === "issues") {
          const i = await listIssuesCategorized(repoSlug, githubToken);
          if (!ignore) setIssuesList(i || []);
        } else if (activeTab === "workflows") {
          const w = await listWorkflowsExtended(repoSlug, githubToken);
          if (!ignore) setWorkflowsList(w || []);
        }
      } catch (err) {
        console.warn("Error loading tab data:", err);
      }
    };
    fetchTabData();
    return () => {
      ignore = true;
    };
  }, [repoSlug, activeTab, githubToken]);

  const loadTabData = useCallback(async () => {
    if (!repoSlug) return;
    setLoading(true);
    try {
      if (activeTab === "branches") {
        const b = await listBranchesExtended(repoSlug, githubToken);
        setBranchesList(b || []);
      } else if (activeTab === "prs") {
        const p = await listPRsExtended(repoSlug, githubToken);
        setPrsList(p || []);
      } else if (activeTab === "issues") {
        const i = await listIssuesCategorized(repoSlug, githubToken);
        setIssuesList(i || []);
      } else if (activeTab === "workflows") {
        const w = await listWorkflowsExtended(repoSlug, githubToken);
        setWorkflowsList(w || []);
      }
    } catch (err) {
      console.warn("Manual reload error:", err);
    } finally {
      setLoading(false);
    }
  }, [repoSlug, activeTab, githubToken]);

  // SCM Action Starters that generate safe execution plans requiring approval
  const handleTriggerReadme = async () => {
    if (!repoSlug) return;
    setLoading(true);
    try {
      const plan = await planReadmeUpdate(repoSlug, null, null, null, githubToken);
      await fetchPlans();
      openApprovalModal(plan);
    } catch (err) {
      setError(err.message || "Failed to create README update plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBranchAction = async (action, branchName, targetBranch = null) => {
    if (!repoSlug) return;
    setLoading(true);
    try {
      const plan = await planBranchAction(repoSlug, action, branchName, targetBranch, githubToken);
      await fetchPlans();
      openApprovalModal(plan);
    } catch (err) {
      setError(err.message || `Failed to create branch ${action} plan.`);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerPRMerge = async (pullNumber, method = "squash") => {
    if (!repoSlug) return;
    setLoading(true);
    try {
      const plan = await planPRMerge(repoSlug, pullNumber, method, null, null, githubToken);
      await fetchPlans();
      openApprovalModal(plan);
    } catch (err) {
      setError(err.message || "Failed to create PR merge plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerIssueCreate = async (e) => {
    e.preventDefault();
    if (!repoSlug || !newIssueTitle.trim()) return;
    setLoading(true);
    try {
      const plan = await planIssueAction(
        repoSlug,
        "create",
        null,
        newIssueTitle.trim(),
        newIssueBody,
        [newIssueLabel],
        null,
        githubToken
      );
      setNewIssueTitle("");
      setNewIssueBody("");
      await fetchPlans();
      openApprovalModal(plan);
    } catch (err) {
      setError(err.message || "Failed to create issue plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerIssueClose = async (number) => {
    if (!repoSlug) return;
    setLoading(true);
    try {
      const plan = await planIssueAction(repoSlug, "close", number, null, null, null, null, githubToken);
      await fetchPlans();
      openApprovalModal(plan);
    } catch (err) {
      setError(err.message || "Failed to create close issue plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRelease = async () => {
    if (!repoSlug) return;
    setLoading(true);
    try {
      const plan = await planReleasePublish(repoSlug, releaseTag, null, null, null, false, false, githubToken);
      await fetchPlans();
      openApprovalModal(plan);
    } catch (err) {
      setError(err.message || "Failed to create release publish plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerWorkflow = async () => {
    if (!repoSlug) return;
    setLoading(true);
    try {
      const plan = await planWorkflowCommit(repoSlug, wfFilename, wfContent || "", null, null, githubToken);
      await fetchPlans();
      openApprovalModal(plan);
    } catch (err) {
      setError(err.message || "Failed to create workflow commit plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCleanup = async () => {
    if (!repoSlug) return;
    setLoading(true);
    try {
      const plan = await planCleanupBundle(repoSlug, githubToken);
      await fetchPlans();
      openApprovalModal(plan);
    } catch (err) {
      setError(err.message || "Failed to generate cleanup bundle plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h1 className="text-xl font-bold text-white tracking-wide">
                SCM Execution Center (Real GitHub Actions)
              </h1>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Directly execute verified Software Configuration Management operations on GitHub with safe preview and approval guarantees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {repoSlug ? (
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
                Target: <strong className="text-blue-400">{repoSlug}</strong>
              </span>
            ) : (
              <span className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-xl border border-amber-500/20">
                No repository active. Please scan or select a repository first.
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
        </div>
      )}

      {/* Pending Approval Plans Banner */}
      {stagedPlans && stagedPlans.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/30 to-blue-950/30 border border-amber-500/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <span>⏳</span>
              <span>Staged Execution Plans Awaiting User Approval ({stagedPlans.length})</span>
            </div>
            <span className="text-[11px] text-slate-400">Zero-risk approval gate active</span>
          </div>

          <div className="space-y-2">
            {stagedPlans.map((p, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{p.title}</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {p.action_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>
                </div>

                <button
                  onClick={() => openApprovalModal(p)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow transition whitespace-nowrap"
                >
                  Review Diff & Approve →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Modules Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: "cleanup", label: "🧹 Cleanup Assistant", badge: "Bundle" },
          { id: "readme", label: "📖 Real README Updater" },
          { id: "branches", label: "🌿 Branch Manager" },
          { id: "prs", label: "🔀 PR Assistant" },
          { id: "issues", label: "📋 Issue Manager" },
          { id: "release", label: "🏷️ Release Publisher" },
          { id: "workflows", label: "⚙️ CI Workflow Manager" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: REPOSITORY CLEANUP ASSISTANT (MODULE 8) */}
      {activeTab === "cleanup" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Repository Hygiene & Cleanup Bundle</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Module 8
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Scans your repository for dead branches, missing LICENSE, missing PR templates, and unprotected default branch. Bundles all fixes into an actionable plan.
              </p>
            </div>

            <button
              onClick={handleTriggerCleanup}
              disabled={loading || !repoSlug}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              <span>⚡</span>
              <span>Generate Unified Cleanup Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-white text-xs block">1. Prune Inactive Branches</strong>
              <p className="text-slate-400 text-[11px] mt-1">
                Identifies branches with no commits for &gt;60 days and safely generates remote ref deletion tasks (never deletes default branch).
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-white text-xs block">2. Enforce Branch Protection</strong>
              <p className="text-slate-400 text-[11px] mt-1">
                Enables pull request reviews, status checks, and prevents direct force-pushes to the primary trunk.
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-white text-xs block">3. Add Open Source MIT License</strong>
              <p className="text-slate-400 text-[11px] mt-1">
                Generates a clean legal LICENSE file to prevent copyright and contributor ambiguity.
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-white text-xs block">4. Install Pull Request Template</strong>
              <p className="text-slate-400 text-[11px] mt-1">
                Creates <code>.github/pull_request_template.md</code> with automated SCM checklists.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REAL README UPDATER (MODULE 2) */}
      {activeTab === "readme" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Real GitHub README Updater & Committer</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                  Module 2
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Fetches current README directly from GitHub, identifies missing sections, generates enterprise content, previews diff side-by-side, and commits directly.
              </p>
            </div>

            <button
              onClick={handleTriggerReadme}
              disabled={loading || !repoSlug}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <span>📝</span>
              <span>Fetch, Diff & Stage README</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <strong className="text-white block">Execution Pipeline:</strong>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span>GET /contents/README.md</span>
              <span>→</span>
              <span>Analyze Gaps</span>
              <span>→</span>
              <span>Compute Diff</span>
              <span>→</span>
              <span className="text-amber-400">Ask Approval</span>
              <span>→</span>
              <span className="text-emerald-400">PUT /contents/README.md</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRANCH MANAGER (MODULE 3) */}
      {activeTab === "branches" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Branch Manager & Remote Protection</span>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
                  Module 3
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Inspect branches, detect stale refs, create new branches, rename, or enforce branch protection.
              </p>
            </div>
            <button
              onClick={loadTabData}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Refresh Branches ↻
            </button>
          </div>

          {/* Quick Branch Operations Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-xs font-semibold text-white block mb-2">Create New Branch</strong>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g. feature/auth-provider"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    handleTriggerBranchAction("create", newBranchName);
                    setNewBranchName("");
                  }}
                  disabled={!newBranchName.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-xs font-semibold text-white block mb-2">Rename Branch</strong>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={renameBranchName}
                  onChange={(e) => setRenameBranchName(e.target.value)}
                  placeholder="Old branch"
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
                <input
                  type="text"
                  value={renameTarget}
                  onChange={(e) => setRenameTarget(e.target.value)}
                  placeholder="New name"
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
                <button
                  onClick={() => {
                    handleTriggerBranchAction("rename", renameBranchName, renameTarget);
                    setRenameBranchName("");
                    setRenameTarget("");
                  }}
                  disabled={!renameBranchName.trim() || !renameTarget.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>

          {/* Branches Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Branch Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Activity</th>
                  <th className="py-2.5 px-3">Recommendation</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {branchesList.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-white flex items-center gap-2">
                      <span>{b.name}</span>
                      {b.is_default && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded">
                          Default
                        </span>
                      )}
                      {b.protected && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded">
                          Protected
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        b.status === "Stale" ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {b.days_since_last_commit} days ago ({b.commit_sha})
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{b.recommendation}</td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      {b.is_default && !b.protected && (
                        <button
                          onClick={() => handleTriggerBranchAction("protect", b.name)}
                          className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white px-2 py-1 rounded transition"
                        >
                          Protect Main
                        </button>
                      )}
                      {b.safe_to_delete && (
                        <button
                          onClick={() => handleTriggerBranchAction("delete", b.name)}
                          className="bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white px-2 py-1 rounded transition"
                        >
                          Delete Ref
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PULL REQUEST ASSISTANT (MODULE 4) */}
      {activeTab === "prs" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Pull Request Assistant & Merge Engine</span>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                  Module 4
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Review open pull requests, assess merge strategies (squash vs merge commit), and execute approved merges.
              </p>
            </div>
            <button onClick={loadTabData} className="text-xs text-slate-400 hover:text-white underline">
              Refresh PRs ↻
            </button>
          </div>

          {prsList.length > 0 ? (
            <div className="space-y-3">
              {prsList.map((pr, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-xs">#{pr.number}</span>
                      <strong className="text-white text-xs">{pr.title}</strong>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        @{pr.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-1 font-mono">
                      <span>{pr.head_branch} → {pr.base_branch}</span>
                      <span>•</span>
                      <span className="text-blue-400">Suggested: {pr.suggested_strategy.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTriggerPRMerge(pr.number, "squash")}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      Squash & Merge
                    </button>
                    <button
                      onClick={() => handleTriggerPRMerge(pr.number, "merge")}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      Merge Commit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No open pull requests found for {repoSlug}.
            </p>
          )}
        </div>
      )}

      {/* TAB 5: ISSUE MANAGER (MODULE 5) */}
      {activeTab === "issues" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>SCM Issue Manager & Triage</span>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                  Module 5
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Triage open issues into Bugs, Features, Security, and Documentation. Create or close issues directly.
              </p>
            </div>
            <button onClick={loadTabData} className="text-xs text-slate-400 hover:text-white underline">
              Refresh Issues ↻
            </button>
          </div>

          {/* Create Issue Form */}
          <form onSubmit={handleTriggerIssueCreate} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <strong className="text-xs font-semibold text-white block">Create SCM Issue</strong>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newIssueTitle}
                onChange={(e) => setNewIssueTitle(e.target.value)}
                placeholder="Issue title (e.g. fix(auth): token expiration)"
                className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              />
              <select
                value={newIssueLabel}
                onChange={(e) => setNewIssueLabel(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
              >
                <option value="bug">bug / defect</option>
                <option value="enhancement">enhancement</option>
                <option value="documentation">documentation</option>
                <option value="security">security</option>
              </select>
            </div>
            <textarea
              value={newIssueBody}
              onChange={(e) => setNewIssueBody(e.target.value)}
              placeholder="Issue description and reproduction steps..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!newIssueTitle.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg disabled:opacity-50"
            >
              Stage New Issue Plan
            </button>
          </form>

          {/* Issues List */}
          <div className="space-y-2">
            {issuesList.map((issue, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-xs">#{issue.number}</span>
                    <strong className="text-white text-xs">{issue.title}</strong>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      issue.priority === "Critical" ? "bg-rose-500/20 text-rose-300" : "bg-slate-800 text-slate-300"
                    }`}>
                      {issue.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Author: @{issue.author}</p>
                </div>

                <button
                  onClick={() => handleTriggerIssueClose(issue.number)}
                  className="bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs px-3 py-1 rounded-lg transition"
                >
                  Close Issue
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RELEASE PUBLISHER (MODULE 6) */}
      {activeTab === "release" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Release Manager & Tag Publisher</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Module 6
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Computes next SemVer tag from recent commit messages, synthesizes categorized release notes, and publishes the GitHub release.
              </p>
            </div>

            <button
              onClick={handleTriggerRelease}
              disabled={loading || !repoSlug}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              <span>🏷️</span>
              <span>Draft & Publish Release Plan</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <label className="text-xs text-slate-300 font-medium">Target Tag:</label>
            <input
              type="text"
              value={releaseTag}
              onChange={(e) => setReleaseTag(e.target.value)}
              placeholder="auto or e.g. v1.1.0"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none w-48 font-mono"
            />
            <span className="text-slate-500 text-xs">(Enter 'auto' for dynamic SemVer computation based on commits)</span>
          </div>
        </div>
      )}

      {/* TAB 7: WORKFLOW MANAGER (MODULE 7) */}
      {activeTab === "workflows" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>GitHub Actions Workflow Manager</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                  Module 7
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Inspect continuous integration pipelines, generate language-specific YAML, and commit directly to <code>.github/workflows/</code>.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="text-xs text-slate-300 font-medium whitespace-nowrap">Target Filename:</label>
              <input
                type="text"
                value={wfFilename}
                onChange={(e) => setWfFilename(e.target.value)}
                placeholder="ci.yml or test.yml"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none w-48 font-mono"
              />
              <span className="text-[11px] text-slate-500">(Saved to .github/workflows/{wfFilename})</span>
            </div>

            <textarea
              value={wfContent}
              onChange={(e) => setWfContent(e.target.value)}
              placeholder="Optional: Paste custom YAML workflow or leave empty to auto-generate language-specific CI matrix..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-blue-500"
            />

            <button
              onClick={handleTriggerWorkflow}
              disabled={loading || !repoSlug}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <span>⚙️</span>
              <span>Generate & Stage CI Workflow Plan</span>
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Workflows:</h3>
            {workflowsList.length > 0 ? (
              workflowsList.map((wf, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white">{wf.name}</strong>
                    <span className="text-slate-500 text-[11px] block font-mono">{wf.path}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    Status: {wf.latest_run_conclusion}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No existing workflows found in .github/workflows/.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutionCenterPage;
