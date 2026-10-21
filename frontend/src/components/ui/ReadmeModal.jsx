import { useState } from "react";
import { useSCM } from "../../context/SCMContext";

function ReadmeModal() {
  const { readmeModal, closeReadmeModal, auditData } = useSCM();
  const [copied, setCopied] = useState(false);

  if (!readmeModal.isOpen) return null;

  const repoName = auditData?.metadata?.name || "Project";
  const desc = auditData?.metadata?.description || "An awesome project.";
  const lang = auditData?.metadata?.language || "Language";
  const readmeScore = auditData?.readme?.score ?? 0;
  const strengths = auditData?.readme?.strengths || [];
  const improvements = auditData?.readme?.improvements || [];

  const scaffoldedReadme = `# ${repoName}

${desc}

## 🚀 Features
- High-performance architecture
- Automated Software Configuration Management
- Standardized conventions

## 📦 Installation
\`\`\`bash
# Clone the repository
git clone https://github.com/${auditData?.metadata?.owner?.login || "owner"}/${repoName}.git

# Navigate to project directory
cd ${repoName}

# Install dependencies (${lang})
# Add project installation command here
\`\`\`

## 🛠 Usage
\`\`\`bash
# Run application or development server
# Add start command here
\`\`\`

## 🤝 Contributing
Contributions are welcome! Please follow these steps:
1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feat/AmazingFeature\`)
3. Commit your Changes using Conventional Commits (\`git commit -m 'feat: Add AmazingFeature'\`)
4. Push to the Branch (\`git push origin feat/AmazingFeature\`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scaffoldedReadme);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <h3 className="text-xl font-bold text-white">README Quality & Auto-Scaffold</h3>
              <p className="text-xs text-slate-400">Current Completeness Score: {readmeScore}%</p>
            </div>
          </div>
          <button
            onClick={closeReadmeModal}
            className="text-slate-400 hover:text-white text-2xl font-bold p-1 leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Analysis Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-sm font-semibold text-green-400 mb-2">✅ Present Sections ({strengths.length})</h4>
              {strengths.length > 0 ? (
                <ul className="text-xs text-slate-300 space-y-1 list-disc ml-4">
                  {strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">None detected</p>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-sm font-semibold text-amber-400 mb-2">⚠ Recommended Improvements ({improvements.length})</h4>
              {improvements.length > 0 ? (
                <ul className="text-xs text-slate-300 space-y-1 list-disc ml-4">
                  {improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">All standard sections satisfied!</p>
              )}
            </div>
          </div>

          {/* Generated Scaffold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">✨ Recommended SCM Standard README Template</h4>
              <span className="text-xs text-blue-400">Tailored for {lang}</span>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {scaffoldedReadme}
            </pre>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/50">
          <button
            onClick={handleCopy}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {copied ? "✓ Copied Template" : "📋 Copy Scaffolded README"}
          </button>
          <button
            onClick={closeReadmeModal}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReadmeModal;
