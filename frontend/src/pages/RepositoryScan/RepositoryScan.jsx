import { useState } from "react";
import { scanRepository } from "../../api/github";

import RepositoryInfoCard from "../../components/ui/RepositoryInfoCard";
import HealthCard from "../../components/ui/HealthCard";
import ReadmeCard from "../../components/ui/ReadmeCard";
import BranchCard from "../../components/ui/BranchCard";

function RepositoryScan() {

    const [url, setUrl] = useState("");
    const [repoData, setRepoData] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleScan() {

        if (!url.trim()) {
            alert("Please enter a GitHub Repository URL");
            return;
        }

        try {

            setLoading(true);

            const data = await scanRepository(url);

            console.log("Scan Result:", data);

            setRepoData(data);

        } catch (error) {

            console.error(error);

            alert("Repository scan failed.");

        } finally {

            setLoading(false);

        }

    }

    return (

        <div className="p-8 text-white">

            <h1 className="text-3xl font-bold mb-6">
                Repository Scan
            </h1>

            <p className="mb-6 text-slate-400">
                Enter a GitHub repository URL to begin AI analysis.
            </p>

            <div className="flex gap-4">

                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="flex-1 p-4 rounded-lg bg-slate-800 border border-slate-700 outline-none"
                />

                <button
                    onClick={handleScan}
                    className="bg-blue-600 hover:bg-blue-700 px-8 rounded-lg"
                >
                    {loading ? "Scanning..." : "Scan Repository"}
                </button>

            </div>

            {repoData && (

                <>

                    {/* Top Row */}

                    <div className="grid grid-cols-3 gap-6 mt-8">

                        <RepositoryInfoCard
                            repoData={repoData}
                        />

                        <HealthCard
                            score={repoData.health_score}
                            status={repoData.health_status}
                            reasons={repoData.ai_reasons}
                        />

                    </div>

                    {/* README */}

                    <ReadmeCard
                        repoData={repoData}
                    />

                    {/* Branch Analysis */}

                    <div className="mt-8">

                        <BranchCard
                            repoData={repoData}
                        />

                    </div>

                </>

            )}

        </div>

    );

}

export default RepositoryScan;