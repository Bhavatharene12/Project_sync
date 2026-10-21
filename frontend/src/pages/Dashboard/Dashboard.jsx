import { useEffect, useState } from "react";
import { getRepository } from "../../api/github";

import StatCard from "../../components/ui/StatCard";
import RepositoryDoctor from "../../components/ui/RepositoryDoctor";
import QuickActions from "../../components/ui/QuickActions";

function Dashboard() {
  const [repo, setRepo] = useState(null);

  useEffect(() => {
    async function fetchRepository() {
      try {
        const data = await getRepository();

        console.log("Repository Data:", data);

        setRepo(data);
      } catch (error) {
        console.error("API Error:", error);
      }
    }

    fetchRepository();
  }, []);

  console.log("Current Repo State:", repo);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">
          Good Evening, Bhava 👋
        </h1>

        <p className="text-slate-400 mt-2">
          Welcome back to Sync. Here's your repository overview.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="Repository Health"
          value={repo ? repo.status : "Loading..."}
        />

        <StatCard
          title="Active Branches"
          value={repo ? repo.branches : "Loading..."}
        />

        <StatCard
          title="Stars"
          value={repo ? repo.stars : "Loading..."}
        />

        <StatCard
          title="Language"
          value={repo ? repo.language : "Loading..."}
        />
      </div>

      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="col-span-2">
          <RepositoryDoctor />
        </div>

        <QuickActions />
      </div>
    </div>
  );
}

export default Dashboard;