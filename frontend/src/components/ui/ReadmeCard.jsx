function ReadmeCard({ repoData }) {

    return (

        <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-6">

            <h2 className="text-2xl font-bold mb-6">
                📖 AI README Analysis
            </h2>

            <div className="grid grid-cols-2 gap-8">

                <div>

                    <h3 className="text-xl font-bold text-green-400">
                        Score : {repoData.readme_score}%
                    </h3>

                    <p className="mt-2">
                        {repoData.readme_status}
                    </p>

                </div>

                <div>

                    <h3 className="font-bold mb-3">
                        Strengths
                    </h3>

                    <ul className="list-disc ml-6">

                        {repoData.readme_strengths.map((item, index) => (

                            <li key={index}>
                                {item}
                            </li>

                        ))}

                    </ul>

                </div>

            </div>

            <div className="mt-6">

                <h3 className="font-bold text-yellow-400 mb-3">
                    Suggestions
                </h3>

                <ul className="list-disc ml-6">

                    {repoData.readme_improvements.map((item, index) => (

                        <li key={index}>
                            {item}
                        </li>

                    ))}

                </ul>

            </div>

        </div>

    );

}

export default ReadmeCard;