function RepositoryInfoCard({ repoData }) {

    return (

        <div className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6">

            <h2 className="text-2xl font-bold mb-6">
                Repository Information
            </h2>

            <div className="grid grid-cols-2 gap-6">

                <div>
                    <p className="text-slate-400">Repository</p>
                    <p>{repoData.repository}</p>
                </div>

                <div>
                    <p className="text-slate-400">Owner</p>
                    <p>{repoData.owner}</p>
                </div>

                <div>
                    <p className="text-slate-400">Language</p>
                    <p>{repoData.language}</p>
                </div>

                <div>
                    <p className="text-slate-400">Stars</p>
                    <p>{repoData.stars}</p>
                </div>

                <div>
                    <p className="text-slate-400">Forks</p>
                    <p>{repoData.forks}</p>
                </div>

                <div>
                    <p className="text-slate-400">Open Issues</p>
                    <p>{repoData.issues}</p>
                </div>

            </div>

            <div className="mt-6">

                <p className="text-slate-400">
                    Description
                </p>

                <p>
                    {repoData.description}
                </p>

            </div>

        </div>

    );

}

export default RepositoryInfoCard;