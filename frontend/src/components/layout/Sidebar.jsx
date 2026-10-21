function Sidebar() {
  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-500">
          Sync
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          AI SCM Assistant
        </p>
      </div>

      <nav className="mt-8">
        <ul className="space-y-2 px-4">

          <li className="text-white hover:bg-slate-800 p-3 rounded-lg cursor-pointer">
            Dashboard
          </li>

          <li className="text-white hover:bg-slate-800 p-3 rounded-lg cursor-pointer">
            Repository Health
          </li>

          <li className="text-white hover:bg-slate-800 p-3 rounded-lg cursor-pointer">
            Branch Manager
          </li>

          <li className="text-white hover:bg-slate-800 p-3 rounded-lg cursor-pointer">
            Repository Doctor
          </li>

          <li className="text-white hover:bg-slate-800 p-3 rounded-lg cursor-pointer">
            Documentation
          </li>

          <li className="text-white hover:bg-slate-800 p-3 rounded-lg cursor-pointer">
            Repository Intelligence
          </li>

        </ul>
      </nav>
    </div>
  )
}

export default Sidebar