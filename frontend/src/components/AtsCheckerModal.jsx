import { useState } from "react";
import toast from "react-hot-toast";
import { analyzeResume, generateSkillsGap, generateInterviewQuestions } from "../api/ResumeService";

const AtsCheckerModal = ({ resumeData }) => {
  const [jobDescription, setJobDescription] = useState("");
  const [activeTab, setActiveTab]           = useState("ats");
  const [atsResult, setAtsResult]           = useState(null);
  const [skillsGap, setSkillsGap]           = useState(null);
  const [questions, setQuestions]           = useState(null);
  const [loading, setLoading]               = useState(false);

  const run = async (fn, setter) => {
    if (!jobDescription.trim()) { toast.error("Please enter a Job Description"); return; }
    setLoading(true);
    try {
      const res = await fn(resumeData, jobDescription);
      setter(res.data);
    } catch {
      toast.error("AI request failed. Is Ollama running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog id="ai_modal" className="modal">
      <div className="modal-box w-11/12 max-w-5xl">
        <h3 className="font-bold text-xl mb-4">🧠 AI Career Tools</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { id: "ats",       label: "ATS Checker" },
            { id: "gap",       label: "Skills Gap" },
            { id: "questions", label: "Interview Prep" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* JD Input */}
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Job Description</span></label>
            <textarea
              className="textarea textarea-bordered h-64 resize-none"
              placeholder="Paste the full Job Description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* Results panel */}
          <div className="bg-base-200 p-4 rounded-lg overflow-y-auto h-64">

            {/* ATS Tab */}
            {activeTab === "ats" && (
              <div className="space-y-3">
                {!atsResult && <p className="text-center text-base-content/40 mt-10">Run ATS Check to see results</p>}
                {atsResult && (
                  <>
                    <div className="text-center">
                      <div
                        className={`radial-progress ${atsResult.score > 70 ? "text-success" : atsResult.score > 40 ? "text-warning" : "text-error"}`}
                        style={{ "--value": atsResult.score }}
                        role="progressbar"
                      >
                        {atsResult.score}%
                      </div>
                      <p className="text-sm font-bold mt-1">ATS Match Score</p>
                    </div>
                    <div>
                      <p className="font-bold text-error text-sm">Missing Keywords</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {atsResult.missingKeywords?.map((kw, i) => (
                          <span key={i} className="badge badge-error badge-outline text-xs">{kw}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-info text-sm">Feedback</p>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {atsResult.feedback?.map((fb, i) => <li key={i}>{fb}</li>)}
                      </ul>
                    </div>
                  </>
                )}
                <button className="btn btn-primary btn-sm w-full" onClick={() => run(analyzeResume, setAtsResult)} disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-xs" /> : "Analyze Resume"}
                </button>
              </div>
            )}

            {/* Skills Gap Tab */}
            {activeTab === "gap" && (
              <div className="space-y-3">
                {!skillsGap && <p className="text-center text-base-content/40 mt-10">Run Skills Gap Analysis</p>}
                {skillsGap && (
                  <>
                    <p className="font-bold text-center text-lg">{skillsGap.overallReadiness} Ready</p>
                    <div>
                      <p className="font-bold text-success text-xs">✅ Matching Skills</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {skillsGap.matchingSkills?.map((s, i) => <span key={i} className="badge badge-success badge-sm">{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-error text-xs">❌ Missing Skills</p>
                      <div className="space-y-1 mt-1">
                        {skillsGap.missingSkills?.map((s, i) => (
                          <div key={i} className="text-xs bg-base-100 rounded p-1">
                            <span className="font-bold">{s.skill}</span> — {s.resource}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <button className="btn btn-secondary btn-sm w-full" onClick={() => run(generateSkillsGap, setSkillsGap)} disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-xs" /> : "Analyze Skills Gap"}
                </button>
              </div>
            )}

            {/* Interview Prep Tab */}
            {activeTab === "questions" && (
              <div className="space-y-3">
                {!questions && <p className="text-center text-base-content/40 mt-10">Generate interview questions for this role</p>}
                {questions && (
                  <>
                    <div>
                      <p className="font-bold text-sm">🎯 Technical Questions</p>
                      <ol className="list-decimal list-inside text-xs space-y-1 mt-1">
                        {questions.technical?.map((q, i) => <li key={i}>{q}</li>)}
                      </ol>
                    </div>
                    <div>
                      <p className="font-bold text-sm">💬 Behavioral Questions</p>
                      <ol className="list-decimal list-inside text-xs space-y-1 mt-1">
                        {questions.behavioral?.map((q, i) => <li key={i}>{q}</li>)}
                      </ol>
                    </div>
                  </>
                )}
                <button className="btn btn-accent btn-sm w-full" onClick={() => run(generateInterviewQuestions, setQuestions)} disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-xs" /> : "Generate Questions"}
                </button>
              </div>
            )}

          </div>
        </div>

        <div className="modal-action">
          <form method="dialog"><button className="btn">Close</button></form>
        </div>
      </div>
    </dialog>
  );
};

export default AtsCheckerModal;
