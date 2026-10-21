import { useNavigate } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";
import RepositoryDoctor from "../../components/ui/RepositoryDoctor";
import SCMProblemsCard from "../../components/ui/SCMProblemsCard";
import SCMRecommendationsCard from "../../components/ui/SCMRecommendationsCard";

function DoctorPage() {
  const navigate = useNavigate();
  const { auditData } = useSCM();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>🩺</span> Repository Doctor
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated SCM diagnostic inspector diagnosing rule violations and recommending surgical fixes.
          </p>
        </div>
        <button
          onClick={() => navigate("/repository-scan")}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
        >
          {auditData ? "Re-scan Repository" : "Scan Repository"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <RepositoryDoctor />
        {auditData && (
          <>
            <SCMProblemsCard problems={auditData.report?.problems} />
            <SCMRecommendationsCard recommendations={auditData.report?.recommendations} />
          </>
        )}
      </div>
    </div>
  );
}

export default DoctorPage;
