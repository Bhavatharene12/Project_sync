function QuickActions() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full">

      <h2 className="text-2xl font-bold text-white mb-6">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 transition">
          🔍 Scan Repository
        </button>

        <button className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg p-4 transition">
          📄 Generate README
        </button>

        <button className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg p-4 transition">
          🌿 Analyze Branches
        </button>

        <button className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg p-4 transition">
          📝 Generate Release Notes
        </button>

      </div>

    </div>
  );
}

export default QuickActions;