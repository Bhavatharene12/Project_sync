import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import SCMToolModalHost from "../ui/SCMToolModalHost";
import { useSCM } from "../../context/SCMContext";

function Layout({ children }) {
  const { error, setError } = useSCM();

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        {/* Global Error Banner */}
        {error && (
          <div className="mx-8 mt-6 bg-red-950/80 border border-red-700/60 text-red-200 px-5 py-3.5 rounded-xl flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold">Notice</p>
                <p className="text-xs text-red-300 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white text-lg font-bold px-2 py-1"
            >
              ×
            </button>
          </div>
        )}

        <main className="flex-1 px-6 py-6 md:px-10 md:py-8 w-full max-w-[1600px] mx-auto min-w-0 pb-16">
          {children}
        </main>
      </div>

      {/*  Unified SCM Tool Modal Host   */}
      <SCMToolModalHost />
    </div>
  );
}

export default Layout;