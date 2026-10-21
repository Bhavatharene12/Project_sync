/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  auditRepositorySCM,
  getSCMMarkdownReport,
  generateSCMReadme,
  generateBranchStrategy,
  generateReleasePlan,
  generateCommitGuide,
  generateCIWorkflow,
  getImpactAnalysis,
  verifyGitHubToken,
  listStagedPlans,
  applyPlan,
  getActivityTimeline,
  clearActivityTimeline,
} from "../api/github";

const SCMContext = createContext(null);

const STORAGE_KEY = "sync_scm_latest_audit";
const HISTORY_KEY = "sync_scm_execution_history";
const CHECKLIST_KEY = "sync_scm_checklist_state";
const TOKEN_KEY = "sync_github_token";

const LOADING_STAGES = [
  "Fetching Repository Metadata...",
  "Analyzing README Documentation...",
  "Checking Branch Hygiene...",
  "Auditing Commits, Releases & Workflows...",
  "Generating SCM Audit Report..."
];

export function SCMProvider({ children }) {
  // GitHub PAT Token & Connection Info
  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem(TOKEN_KEY) || "";
  });
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Staged Plans & Approval Modal State
  const [stagedPlans, setStagedPlans] = useState([]);
  const [activeApprovalPlan, setActiveApprovalPlan] = useState(null);
  const [planExecutionResult, setPlanExecutionResult] = useState(null);
  const [approving, setApproving] = useState(false);

  // Activity Timeline (Backend-persisted)
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Scanned repository audit data
  const [auditData, setAuditData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Execution History
  const [executionHistory, setExecutionHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic SCM Checklist Overrides
  const [checklistOverrides, setChecklistOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(LOADING_STAGES[0]);
  const [error, setError] = useState(null);

  // Active Tool Modal state: null | 'README' | 'BRANCH' | 'RELEASE' | 'COMMIT' | 'WORKFLOW' | 'IMPACT' | 'REPORT' | 'EXPORT'
  const [activeModal, setActiveModal] = useState(null);
  const [modalPayload, setModalPayload] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Persist latest audit data
  useEffect(() => {
    if (auditData) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(auditData));
      } catch (err) {
        console.warn("Unable to persist audit to localStorage", err);
      }
    }
  }, [auditData]);

  // Persist execution history
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(executionHistory));
    } catch (err) {
      console.warn("Unable to persist history to localStorage", err);
    }
  }, [executionHistory]);

  // Persist checklist overrides
  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklistOverrides));
    } catch (err) {
      console.warn("Unable to persist checklist to localStorage", err);
    }
  }, [checklistOverrides]);

  const addHistoryEntry = (actionTitle, category, outputSummary, payload = null) => {
    const entry = {
      id: `HIST-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: actionTitle,
      category,
      summary: outputSummary,
      repo: auditData ? `${auditData.metadata?.owner?.login}/${auditData.metadata?.name}` : "General",
      payload,
      status: "Completed"
    };
    setExecutionHistory(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50
  };

  const clearHistory = () => {
    setExecutionHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const toggleChecklistItem = (id) => {
    setChecklistOverrides(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Derived legacy-compatible scan object for existing cards
  const legacyScanData = auditData ? {
    success: true,
    repository: auditData.metadata?.name || auditData.report?.repository || "Unknown",
    owner: auditData.metadata?.owner?.login || auditData.report?.owner || "Unknown",
    description: auditData.metadata?.description || "No description provided.",
    language: auditData.metadata?.language || "Not specified",
    stars: auditData.metadata?.stargazers_count ?? 0,
    forks: auditData.metadata?.forks_count ?? 0,
    issues: auditData.metadata?.open_issues_count ?? 0,
    default_branch: auditData.metadata?.default_branch || "main",

    // Health
    health_score: auditData.health?.score ?? 0,
    health_status: auditData.health?.health ?? "Unknown",
    ai_reasons: auditData.health?.reasons || [],

    // README
    readme_score: auditData.readme?.score ?? 0,
    readme_status: auditData.readme?.status ?? "Not Evaluated",
    readme_strengths: auditData.readme?.strengths || [],
    readme_improvements: auditData.readme?.improvements || [],

    // Branches
    branch_score: auditData.branches?.score ?? 0,
    branch_status: auditData.branches?.status ?? "Not Evaluated",
    branch_count: auditData.branches?.total_branches ?? 0,
    branch_strengths: auditData.branches?.strengths || [],
    branch_suggestions: auditData.branches?.suggestions || [],
  } : null;

  // Calculate composite SCM Maturity Score (0-100)
  const scmMaturityScore = auditData ? Math.round(
    ((auditData.health?.score || 0) * 0.20) +
    ((auditData.readme?.score || 0) * 0.20) +
    ((auditData.branches?.score || 0) * 0.20) +
    ((auditData.commits_audit?.conventional_commit_rate || 0) * 0.15) +
    ((auditData.release_audit?.semver_compliance_rate || 0) * 0.10) +
    ((auditData.workflow_audit?.ci_pass_rate || (auditData.workflow_audit?.total_workflows > 0 ? 80 : 20)) * 0.15)
  ) : 0;

  // Dynamic SCM Checklist calculation
  const getSmartChecklist = () => {
    if (!auditData) return [];

    const readmeDone = (auditData.readme?.score ?? 0) >= 70;
    const licenseDone = auditData.readme?.strengths?.some(s => s.toLowerCase().includes("license")) || false;
    const ciDone = (auditData.workflow_audit?.total_workflows ?? 0) > 0;
    const releaseDone = (auditData.release_audit?.total_releases ?? 0) > 0;
    const branchDone = (auditData.branches?.total_branches ?? 0) > 1 && auditData.metadata?.default_branch === "main";
    const commitDone = (auditData.commits_audit?.conventional_commit_rate ?? 0) >= 70;
    const issueDone = (auditData.metadata?.open_issues_count ?? 0) < 50;

    const baseList = [
      { id: "chk_readme", label: "Comprehensive README Documentation", desc: "Installation, Usage & Contributing guides available", auto: readmeDone, category: "Documentation", actionType: "README" },
      { id: "chk_license", label: "Standard Open Source License", desc: "Explicit licensing terms disclosed", auto: licenseDone, category: "Legal", actionType: "README" },
      { id: "chk_ci", label: "Automated CI/CD Workflow Pipeline", desc: "GitHub Actions running automated tests and linters", auto: ciDone, category: "Automation", actionType: "WORKFLOW" },
      { id: "chk_release", label: "Formal SemVer Release Baselines", desc: "Tagged version releases with categorized changelogs", auto: releaseDone, category: "Releases", actionType: "RELEASE" },
      { id: "chk_branch", label: "Structured Feature Branching Strategy", desc: "Multiple branches isolating development from main", auto: branchDone, category: "Branching", actionType: "BRANCH" },
      { id: "chk_commit", label: "Conventional Commits Compliance (≥70%)", desc: "Standardized semantic commit history", auto: commitDone, category: "Commits", actionType: "COMMIT" },
      { id: "chk_issues", label: "Issue Management & Backlog Health", desc: "Managed defect rate without runaway backlog sprawl", auto: issueDone, category: "Tracking", actionType: "IMPACT" },
    ];

    return baseList.map(item => {
      const isCompleted = checklistOverrides[item.id] !== undefined
        ? checklistOverrides[item.id]
        : item.auto;
      return { ...item, completed: isCompleted };
    });
  };

  /**
   * Run end-to-end repository scan with staged progress feedback
   */
  const performScan = async (url) => {
    if (!url || !url.trim()) {
      setError("Please enter a GitHub repository URL or 'owner/repo' shorthand.");
      return null;
    }

    setLoading(true);
    setError(null);

    let stageIndex = 0;
    setLoadingStage(LOADING_STAGES[0]);
    const interval = setInterval(() => {
      stageIndex = (stageIndex + 1) % LOADING_STAGES.length;
      setLoadingStage(LOADING_STAGES[stageIndex]);
    }, 700);

    try {
      const data = await auditRepositorySCM(url.trim());
      setAuditData(data);
      addHistoryEntry(
        `Scanned Repository: ${data.metadata?.owner?.login}/${data.metadata?.name}`,
        "Audit",
        `Completed SCM audit. Overall Health Grade: ${data.health?.health} (${data.health?.score}%).`,
        data
      );
      return data;
    } catch (err) {
      setError(err.message || "Failed to scan repository.");
      return null;
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingStage(LOADING_STAGES[0]);
    }
  };

  const getRepoSlug = () => {
    if (!auditData) return null;
    return `${auditData.metadata?.owner?.login || auditData.report?.owner}/${auditData.metadata?.name || auditData.report?.repository}`;
  };

  // --- Modal Openers for SCM Tools ---
  const openToolModal = async (toolType) => {
    const slug = getRepoSlug();
    if (!slug) {
      setError("Please scan a repository first before launching this SCM workflow.");
      return;
    }

    setActiveModal(toolType);
    setModalLoading(true);
    setModalPayload(null);

    try {
      let result = null;
      if (toolType === "README") {
        result = await generateSCMReadme(slug);
        addHistoryEntry(`Generated Enterprise README`, "Documentation", `Created complete README tailored for ${result.language}.`, result);
      } else if (toolType === "BRANCH") {
        result = await generateBranchStrategy(slug);
        addHistoryEntry(`Generated SCM Branch Strategy`, "Branching", `Configured ${result.model} model and branch lifecycle.`, result);
      } else if (toolType === "RELEASE") {
        result = await generateReleasePlan(slug);
        addHistoryEntry(`Created Release Plan ${result.target_version}`, "Releases", `Synthesized changelog and pre-release checklist.`, result);
      } else if (toolType === "COMMIT") {
        result = await generateCommitGuide(slug);
        addHistoryEntry(`Audited & Rewrote Commit Messages`, "Commits", `Rewrote substandard commits and generated Conventional Commits guide.`, result);
      } else if (toolType === "WORKFLOW") {
        result = await generateCIWorkflow(slug);
        addHistoryEntry(`Generated GitHub Actions CI Pipeline`, "Automation", `Created ${result.filename} continuous integration workflow.`, result);
      } else if (toolType === "IMPACT") {
        result = await getImpactAnalysis(slug);
        addHistoryEntry(`Performed Change Impact Analysis`, "Impact", `Assessed risk level as ${result.risk_level} with ${result.merge_conflict_probability}% conflict probability.`, result);
      } else if (toolType === "REPORT") {
        result = await getSCMMarkdownReport(slug);
        addHistoryEntry(`Compiled SCM Audit Report`, "Report", `Generated ready-to-publish Markdown audit report.`, result);
      } else if (toolType === "EXPORT") {
        result = { ready: true };
      }
      setModalPayload(result);
    } catch (err) {
      setError(err.message || `Failed to execute ${toolType} assistant workflow.`);
      setActiveModal(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
    setModalLoading(false);
  };

  const clearScannedData = () => {
    setAuditData(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // --- Execution Engine Methods ---
  const refreshConnection = useCallback(async (tokenToVerify = githubToken) => {
    setConnectionLoading(true);
    try {
      const data = await verifyGitHubToken(tokenToVerify || null);
      setConnectionInfo(data);
      return data;
    } catch (err) {
      console.warn("Connection verification failed:", err);
      return null;
    } finally {
      setConnectionLoading(false);
    }
  }, [githubToken]);

  const connectToken = async (token) => {
    const trimmed = token?.trim() || "";
    setGithubToken(trimmed);
    if (trimmed) {
      localStorage.setItem(TOKEN_KEY, trimmed);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    const info = await refreshConnection(trimmed);
    return info;
  };

  const disconnectToken = () => {
    setGithubToken("");
    localStorage.removeItem(TOKEN_KEY);
    setConnectionInfo(null);
  };

  const fetchPlans = useCallback(async () => {
    try {
      const data = await listStagedPlans();
      setStagedPlans(data || []);
      return data;
    } catch (err) {
      console.warn("Could not fetch staged plans:", err);
      return [];
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const data = await getActivityTimeline();
      setTimeline(data || []);
      return data;
    } catch (err) {
      console.warn("Could not fetch timeline:", err);
      return [];
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const initializeExecutionData = async () => {
      try {
        const info = await verifyGitHubToken(githubToken || null);
        if (!ignore && info) setConnectionInfo(info);
      } catch {
        // ignore
      }
      try {
        const plans = await listStagedPlans();
        if (!ignore && plans) setStagedPlans(plans);
      } catch {
        // ignore
      }
      try {
        const t = await getActivityTimeline();
        if (!ignore && t) setTimeline(t);
      } catch {
        // ignore
      }
    };
    initializeExecutionData();
    return () => {
      ignore = true;
    };
  }, [githubToken]);

  const openApprovalModal = (plan) => {
    setActiveApprovalPlan(plan);
    setPlanExecutionResult(null);
  };

  const closeApprovalModal = () => {
    setActiveApprovalPlan(null);
    setPlanExecutionResult(null);
    setApproving(false);
  };

  const handleApprovePlan = async (planId) => {
    setApproving(true);
    setError(null);
    try {
      const receipt = await applyPlan(planId, true, githubToken);
      setPlanExecutionResult(receipt);
      addHistoryEntry(
        `Executed: ${receipt.summary || receipt.action_type}`,
        receipt.action_type || "Execution",
        `Receipt status: ${receipt.status}. ${receipt.verification_message || ""}`,
        receipt
      );
      await fetchPlans();
      await fetchTimeline();
      return receipt;
    } catch (err) {
      setError(err.message || "Failed to execute plan.");
      return null;
    } finally {
      setApproving(false);
    }
  };

  const handleRejectPlan = async (planId, reason = null) => {
    setApproving(true);
    try {
      const receipt = await applyPlan(planId, false, githubToken, reason);
      setPlanExecutionResult(receipt);
      await fetchPlans();
      await fetchTimeline();
      return receipt;
    } catch (err) {
      setError(err.message || "Failed to reject plan.");
      return null;
    } finally {
      setApproving(false);
    }
  };

  const handleClearTimeline = async () => {
    try {
      await clearActivityTimeline();
      setTimeline([]);
    } catch (err) {
      console.warn("Failed to clear timeline:", err);
    }
  };

  const switchActiveRepository = async (repoSlug) => {
    return await performScan(repoSlug);
  };

  return (
    <SCMContext.Provider
      value={{
        auditData,
        legacyScanData,
        scmMaturityScore,
        loading,
        loadingStage,
        error,
        setError,
        performScan,
        clearScannedData,
        executionHistory,
        addHistoryEntry,
        clearHistory,
        getSmartChecklist,
        toggleChecklistItem,
        activeModal,
        modalPayload,
        modalLoading,
        openToolModal,
        closeModal,

        // GitHub Authentication & Connection
        githubToken,
        connectionInfo,
        connectionLoading,
        connectToken,
        disconnectToken,
        refreshConnection,

        // Execution Plans & Safe Approval System
        stagedPlans,
        fetchPlans,
        activeApprovalPlan,
        openApprovalModal,
        closeApprovalModal,
        handleApprovePlan,
        handleRejectPlan,
        planExecutionResult,
        approving,

        // Persistent SCM Activity Timeline
        timeline,
        timelineLoading,
        fetchTimeline,
        handleClearTimeline,

        // Repository switching
        switchActiveRepository,
      }}
    >
      {children}
    </SCMContext.Provider>
  );
}

export function useSCM() {
  const context = useContext(SCMContext);
  if (!context) {
    throw new Error("useSCM must be used within an SCMProvider");
  }
  return context;
}
