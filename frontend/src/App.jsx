import { Routes, Route, Navigate } from "react-router-dom";
import { SCMProvider } from "./context/SCMContext";
import Layout from "./components/layout/Layout";
import ApprovalModal from "./components/ui/ApprovalModal";

import Dashboard from "./pages/Dashboard/Dashboard";
import ActionCenterPage from "./pages/ActionCenter/ActionCenterPage";
import ExecutionCenterPage from "./pages/ExecutionCenter/ExecutionCenterPage";
import RepositoryScan from "./pages/RepositoryScan/RepositoryScan";
import RepositoryManagerPage from "./pages/RepositoryManager/RepositoryManagerPage";
import GitHubConnectionPage from "./pages/GitHubConnection/GitHubConnectionPage";
import ExecutionHistoryPage from "./pages/ExecutionHistory/ExecutionHistoryPage";
import DoctorPage from "./pages/Doctor/DoctorPage";
import BranchManagerPage from "./pages/BranchManager/BranchManagerPage";
import DocumentationPage from "./pages/Documentation/DocumentationPage";
import IntelligencePage from "./pages/Intelligence/IntelligencePage";

function App() {
  return (
    <SCMProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/automation" element={<ActionCenterPage />} />
          <Route path="/actions" element={<ExecutionCenterPage />} />
          <Route path="/repository-scan" element={<RepositoryScan />} />
          <Route path="/repositories" element={<RepositoryManagerPage />} />
          <Route path="/github" element={<GitHubConnectionPage />} />
          <Route path="/execution-history" element={<ExecutionHistoryPage />} />
          <Route path="/doctor" element={<DoctorPage />} />
          <Route path="/branch-manager" element={<BranchManagerPage />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ApprovalModal />
      </Layout>
    </SCMProvider>
  );
}

export default App;