function Topbar() {
  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">

      <h2 className="text-white text-xl font-semibold">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">

        <input
          type="text"
          placeholder="Search Repository..."
          className="bg-slate-800 text-white px-4 py-2 rounded-lg outline-none w-64"
        />

        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
          B
        </div>

      </div>

    </div>
  )
}

export default Topbar