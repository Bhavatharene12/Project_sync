import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";

import Dashboard from "./pages/Dashboard/Dashboard";
import RepositoryScan from "./pages/RepositoryScan/RepositoryScan";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/repository-scan" element={<RepositoryScan />} />
      </Routes>
    </Layout>
  );
}

export default App;