function RepositoryDoctor() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full">

      <h2 className="text-2xl font-bold text-white mb-6">
        Repository Doctor
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span className="text-green-400">
            ✅ README.md is up to date
          </span>

          <span className="text-slate-400">
            Healthy
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-yellow-400">
            ⚠ 3 inactive branches found
          </span>

          <span className="text-yellow-400">
            Review Needed
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-red-400">
            ❌ Commit messages are inconsistent
          </span>

          <span className="text-red-400">
            Poor
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-green-400">
            ✅ Documentation coverage is good
          </span>

          <span className="text-green-400">
            Healthy
          </span>
        </div>

      </div>

      <button
        className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
      >
        Scan Repository
      </button>

    </div>
  );
}

export default RepositoryDoctor;