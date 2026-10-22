import { Routes, Route, Navigate } from "react-router-dom";
import { SCMProvider } from "./context/SCMContext";
import Layout from "./components/layout/Layout";
import ApprovalModal from "./components/ui/ApprovalModal";

import WorkspacePage from "./pages/Workspace/WorkspacePage";
import TeamSyncPage from "./pages/TeamSync/TeamSyncPage";
import EssentialsPage from "./pages/Essentials/EssentialsPage";
import CommitBuilderPage from "./pages/CommitBuilder/CommitBuilderPage";
import ContributionDoctorPage from "./pages/Contributions/ContributionDoctorPage";
import BranchCleanerPage from "./pages/BranchCleaner/BranchCleanerPage";
import UpstreamSyncPage from "./pages/UpstreamSync/UpstreamSyncPage";
import ProjectReviewPage from "./pages/ProjectReview/ProjectReviewPage";
import GitHubConnectionPage from "./pages/GitHubConnection/GitHubConnectionPage";
import RiskAnalyzerPage from "./pages/RiskAnalyzer/RiskAnalyzerPage";
import ReleaseReadinessPage from "./pages/ReleaseReadiness/ReleaseReadinessPage";
import ConflictPredictorPage from "./pages/ConflictPredictor/ConflictPredictorPage";

function App() {
  return (
    <SCMProvider>
      <Layout>
        <Routes>
          {/* SCM Redesign Core Practical Features */}
          <Route path="/" element={<WorkspacePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/risk-analyzer" element={<RiskAnalyzerPage />} />
          <Route path="/release-readiness" element={<ReleaseReadinessPage />} />
          <Route path="/conflict-predictor" element={<ConflictPredictorPage />} />
          <Route path="/team-sync" element={<TeamSyncPage />} />
          <Route path="/essentials" element={<EssentialsPage />} />
          <Route path="/commit-builder" element={<CommitBuilderPage />} />
          <Route path="/contributions" element={<ContributionDoctorPage />} />
          <Route path="/branch-cleaner" element={<BranchCleanerPage />} />
          <Route path="/upstream-sync" element={<UpstreamSyncPage />} />
          <Route path="/project-review" element={<ProjectReviewPage />} />
          <Route path="/github" element={<GitHubConnectionPage />} />

          {/* Graceful Fallback for Legacy URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ApprovalModal />
      </Layout>
    </SCMProvider>
  );
}

export default App;
