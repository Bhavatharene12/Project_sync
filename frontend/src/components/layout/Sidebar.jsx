import { NavLink } from "react-router-dom";
import { useSCM } from "../../context/SCMContext";

function Sidebar() {
  const { auditData } = useSCM();

  const navItems = [
    { name: "Dashboard", path: "/", icon: "📊" },
    { name: "Action Center", path: "/automation", icon: "⚡", badge: "Live" },
    { name: "SCM Execution Center", path: "/actions", icon: "🛠️", badge: "Real API" },
    { name: "Repository Scan", path: "/repository-scan", icon: "🔍" },
    { name: "Repository Switcher", path: "/repositories", icon: "📦" },
    { name: "GitHub Connection", path: "/github", icon: "🔑" },
    { name: "Activity Timeline", path: "/execution-history", icon: "📜" },
    { name: "Repository Doctor", path: "/doctor", icon: "🩺" },
    { name: "Branch Manager", path: "/branch-manager", icon: "🌿" },
    { name: "Documentation", path: "/documentation", icon: "📖" },
    { name: "SCM Intelligence", path: "/intelligence", icon: "🧠" },
  ];

  const repoName = auditData?.metadata?.name || auditData?.report?.repository;
  const ownerName = auditData?.metadata?.owner?.login || auditData?.report?.owner;

  return (
    <div className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
      <div>
        <div className="p-6 border-b border-slate-800/80">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-3xl font-black text-blue-500 tracking-tight">Sync</span>
            <span className="text-xs bg-blue-500/20 text-blue-400 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
              v2.5
            </span>
          </NavLink>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            AI SCM Assistant
          </p>
        </div>

        <nav className="mt-6 px-3">
          <ul className="space-y-1.5">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-semibold pl-3"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Active Repository Card */}
      <div className="p-4 border-t border-slate-800/80 m-3 bg-slate-950/60 rounded-xl border border-slate-800">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Active Repository
        </p>
        {repoName ? (
          <div className="mt-2">
            <p className="text-sm font-bold text-white truncate" title={`${ownerName}/${repoName}`}>
              {ownerName}/{repoName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs text-slate-400">Audit Active</span>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-xs text-slate-500 italic">No repository active</p>
            <NavLink
              to="/repository-scan"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-block mt-1 underline"
            >
              Scan a repo →
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;