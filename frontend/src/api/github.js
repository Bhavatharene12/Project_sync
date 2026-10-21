import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

/**
 * Format Axios errors into user-friendly messages.
 */
export const formatApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    const detail = data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
    if (detail && typeof detail === "object") {
      return detail.message || JSON.stringify(detail);
    }

    if (status === 400) return "Invalid repository URL. Please check the format (e.g. owner/repo).";
    if (status === 404) return "Repository not found on GitHub. Verify that it exists and is public.";
    if (status === 429) return "GitHub API rate limit exceeded. Set a GITHUB_TOKEN in backend/.env.";
    if (status === 502) return "Unable to reach GitHub API. Check your internet connection.";
    return `Server returned error (${status}).`;
  } else if (error.request) {
    return "Backend server is unreachable. Please ensure the FastAPI server is running on http://127.0.0.1:8000.";
  }
  return error.message || "An unexpected error occurred.";
};

/**
 * Legacy mock repository endpoint for initial overview.
 */
export const getRepository = async () => {
  try {
    const response = await axios.get(`${API_BASE}/github/repo`);
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Basic repository scan (compatible with original schema).
 */
export const scanRepository = async (url) => {
  try {
    const response = await axios.post(`${API_BASE}/github/scan`, { url });
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Full repository scan with commit, PR, release, and workflow metrics.
 */
export const fullScanRepository = async (url) => {
  try {
    const response = await axios.post(`${API_BASE}/github/full-scan`, { url });
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Complete SCM audit pipeline with problem detection and recommendations.
 */
export const auditRepositorySCM = async (url) => {
  try {
    const response = await axios.post(`${API_BASE}/scm/audit`, { url });
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Generate formatted Markdown SCM audit report.
 */
export const getSCMMarkdownReport = async (url) => {
  try {
    const response = await axios.post(
      `${API_BASE}/scm/report/markdown`,
      { url },
      { responseType: "text" }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Generate enterprise-grade SCM README.md
 */
export const generateSCMReadme = async (url) => {
  try {
    const response = await axios.post(`${API_BASE}/scm/generate/readme`, { url });
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Generate SCM branching strategy & lifecycle guide
 */
export const generateBranchStrategy = async (url) => {
  try {
    const response = await axios.post(`${API_BASE}/scm/generate/branch-strategy`, { url });
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Generate formal SCM release plan & categorized release notes
 */
export const generateReleasePlan = async (url) => {
  try {
    const response = await axios.post(`${API_BASE}/scm/generate/release-plan`, { url });
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Inspect commits, simulate Conventional Commit rewrites, and generate guide
 */
export const generateCommitGuide = async (url) => {
  try {
    const response = await axios.post(`${API_BASE}/scm/generate/commit-guide`, { url });
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Generate language-specific GitHub Actions CI workflow YAML
 */
export const generateCIWorkflow = async (url) => {
  try {
    const response = await axios.post(`${API_BASE}/scm/generate/workflow`, { url });
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Perform Change Impact Analysis and conflict risk estimation
 */
export const getImpactAnalysis = async (url) => {
  try {
    const response = await axios.post(`${API_BASE}/scm/impact-analysis`, { url });
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Query SCM Assistant operational capabilities.
 */
export const getSCMStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE}/scm/status`);
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/* =========================================================================
   PROMPT 4: GITHUB EXECUTION ENGINE (REAL SCM ACTIONS)
========================================================================= */

/**
 * Module 1: Verify GitHub Personal Access Token and discover accessible repos
 */
export const verifyGitHubToken = async (token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/connection/verify`,
      { token },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Get current GitHub connection status & rate limit inspection
 */
export const getGitHubConnectionStatus = async (token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${API_BASE}/github/execute/connection/status`,
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * List all staged execution plans
 */
export const listStagedPlans = async () => {
  try {
    const response = await axios.get(`${API_BASE}/github/execute/plans`);
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Get specific staged plan by ID
 */
export const getPlanDetails = async (planId) => {
  try {
    const response = await axios.get(`${API_BASE}/github/execute/plans/${planId}`);
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Apply or reject a staged execution plan (Safe Approval Gatekeeper)
 */
export const applyPlan = async (planId, approved, token = null, rejectionReason = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/apply`,
      { plan_id: planId, approved, token, rejection_reason: rejectionReason },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 2: Stage Real README Update Plan with diff preview
 */
export const planReadmeUpdate = async (url, content = null, commitMessage = null, branch = null, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/readme/plan`,
      { url, content, commit_message: commitMessage, branch, token },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 3: List branches with staleness, protection, and recommendations
 */
export const listBranchesExtended = async (url, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/branches/list`,
      { url },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 3: Stage Branch Action (create, delete, rename, protect)
 */
export const planBranchAction = async (url, action, branchName, targetBranch = null, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/branches/plan`,
      { url, action, branch_name: branchName, target_branch: targetBranch, token },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 4: List pull requests with review summary & merge recommendations
 */
export const listPRsExtended = async (url, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/prs/list`,
      { url },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 4: Stage Pull Request Merge Plan
 */
export const planPRMerge = async (url, pullNumber, mergeMethod = "squash", commitTitle = null, commitMessage = null, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/prs/merge/plan`,
      { url, pull_number: pullNumber, merge_method: mergeMethod, commit_title: commitTitle, commit_message: commitMessage, token },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 5: List and categorize repository issues
 */
export const listIssuesCategorized = async (url, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/issues/list`,
      { url },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 5: Stage Issue Action (create, close, label, assign)
 */
export const planIssueAction = async (url, action, issueNumber = null, title = null, body = null, labels = null, assignees = null, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/issues/plan`,
      { url, action, issue_number: issueNumber, title, body, labels, assignees, token },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 6: Stage Release Publish Plan with resolved SemVer
 */
export const planReleasePublish = async (url, tagName = "auto", name = null, body = null, targetCommitish = null, draft = false, prerelease = false, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/release/plan`,
      { url, tag_name: tagName, name, body, target_commitish: targetCommitish, draft, prerelease, token },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 7: List GitHub Actions workflows and runs
 */
export const listWorkflowsExtended = async (url, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/workflows/list`,
      { url },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 7: Stage GitHub Actions Workflow Commit Plan
 */
export const planWorkflowCommit = async (url, filename, content, commitMessage = null, branch = null, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/workflows/plan`,
      { url, filename, content, commit_message: commitMessage, branch, token },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 8: Stage Repository Cleanup Hygiene Bundle Plan
 */
export const planCleanupBundle = async (url, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${API_BASE}/github/execute/cleanup/plan`,
      { url },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 9: Get SCM Activity Timeline history
 */
export const getActivityTimeline = async () => {
  try {
    const response = await axios.get(`${API_BASE}/github/execute/timeline`);
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};

/**
 * Module 9: Clear SCM Activity Timeline
 */
export const clearActivityTimeline = async () => {
  try {
    const response = await axios.delete(`${API_BASE}/github/execute/timeline`);
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error), { cause: error });
  }
};