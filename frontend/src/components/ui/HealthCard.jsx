function HealthCard({ score, status, reasons = [] }) {

    return (

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">

            <h2 className="text-2xl font-bold mb-6">
                🧠 AI Repository Health
            </h2>

            <h1 className="text-5xl font-bold text-green-400">
                {score}%
            </h1>

            <p className="mt-3 text-lg">
                {status}
            </p>

            {reasons.length > 0 && (

                <div className="mt-6">

                    <h3 className="font-bold mb-3">
                        AI Analysis
                    </h3>

                    <ul className="list-disc ml-6">

                        {reasons.map((reason, index) => (

                            <li key={index}>
                                {reason}
                            </li>

                        ))}

                    </ul>

                </div>

            )}

        </div>

    );

}

export default HealthCard;