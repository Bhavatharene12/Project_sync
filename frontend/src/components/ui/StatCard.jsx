function StatCard({ title, value }) {
  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <h3 className="text-slate-400 text-sm">{title}</h3>

      <p className="text-3xl font-bold text-white mt-3">
        {value}
      </p>
    </div>
  );
}

export default StatCard;