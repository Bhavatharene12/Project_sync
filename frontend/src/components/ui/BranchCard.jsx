function BranchCard({ repoData }) {

    return (

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">

            <h2 className="text-2xl font-bold mb-6">
                🌿 AI Branch Analysis
            </h2>

            <div className="mb-5">

                <h1 className="text-5xl font-bold text-blue-400">
                    {repoData.branch_score}%
                </h1>

                <p className="mt-2 text-lg">
                    {repoData.branch_status}
                </p>

            </div>

            <div className="mb-6">

                <p className="text-slate-400">
                    Total Branches
                </p>

                <p className="text-2xl font-bold">
                    {repoData.branch_count}
                </p>

            </div>

            <div>

                <h3 className="font-bold mb-3">
                    Strengths
                </h3>

                <ul className="list-disc ml-6 space-y-2">

                    {repoData.branch_strengths.map((item, index) => (

                        <li key={index}>
                            {item}
                        </li>

                    ))}

                </ul>

            </div>

            <div className="mt-6">

                <h3 className="font-bold text-yellow-400 mb-3">
                    Suggestions
                </h3>

                <ul className="list-disc ml-6 space-y-2">

                    {repoData.branch_suggestions.map((item, index) => (

                        <li key={index}>
                            {item}
                        </li>

                    ))}

                </ul>

            </div>

        </div>

    );

}

export default BranchCard;