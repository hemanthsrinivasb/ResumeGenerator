import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Users, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { axiosInstance } from "../api/ResumeService";
import toast from "react-hot-toast";

const AGENTS = [
  { key: "ATS",       label: "ATS Optimizer",  emoji: "🤖", desc: "Keyword density, formatting, ATS compatibility",  color: "border-primary"   },
  { key: "RECRUITER", label: "Senior Recruiter",emoji: "👔", desc: "First impressions, narrative, career story",       color: "border-secondary" },
  { key: "TECHNICAL", label: "Staff Engineer",  emoji: "💻", desc: "Technical credibility, stack depth, impact",       color: "border-accent"    },
  { key: "CAREER",    label: "Career Coach",    emoji: "🎯", desc: "Strategy, positioning, brand, target roles",       color: "border-success"   },
];

const SUGGESTIONS = [
  "Review my resume comprehensively",
  "How can I make it FAANG-ready?",
  "What's the weakest part of my resume?",
  "Tailor this for a Senior Backend Engineer role",
  "How do I improve my ATS score?",
];

const fadeUp   = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger  = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12 } } };

export default function AgentPanel() {
  const [message,    setMessage]  = useState("");
  const [resumeId,   setResumeId] = useState("");
  const [results,    setResults]  = useState(null);
  const [loading,    setLoading]  = useState(false);
  const [expanded,   setExpanded] = useState({});

  const runPanel = async () => {
    if (!message.trim()) { toast.error("Enter a message for the AI panel."); return; }
    setLoading(true);
    setResults(null);
    try {
      const body = { message: message.trim() };
      if (resumeId.trim()) body.resumeId = parseInt(resumeId);
      const res = await axiosInstance.post("/api/v1/agents/panel", body);
      setResults(res.data);
    } catch {
      toast.error("Panel run failed. Is the AI backend running?");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div className="max-w-5xl mx-auto px-4 py-10" variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="text-primary" size={32} /> AI Expert Panel
        </h1>
        <p className="text-base-content/50 mt-1">
          Get simultaneous reviews from 4 specialized AI experts — ATS optimizer, recruiter, staff engineer, and career coach.
        </p>
      </motion.div>

      {/* Agent Cards Overview */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {AGENTS.map(a => (
          <div key={a.key} className={`card bg-base-100 shadow-sm border-2 ${a.color} p-3`}>
            <span className="text-2xl">{a.emoji}</span>
            <p className="font-semibold text-sm mt-1">{a.label}</p>
            <p className="text-xs text-base-content/40 mt-0.5">{a.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Input */}
      <motion.div variants={fadeUp} className="card bg-base-100 shadow-md mb-6">
        <div className="card-body p-5 space-y-3">
          <div className="flex flex-wrap gap-2 mb-1">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => setMessage(s)}
                className="btn btn-xs btn-ghost border border-base-300 hover:border-primary hover:text-primary text-xs">
                {s}
              </button>
            ))}
          </div>
          <textarea
            className="textarea textarea-bordered w-full h-20 text-sm resize-none"
            placeholder="What should the AI panel focus on? e.g. 'Review my resume for a FAANG SWE role'"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex gap-3">
            <input
              className="input input-bordered input-sm flex-1 text-sm"
              placeholder="Resume ID (optional — uses latest if blank)"
              value={resumeId}
              onChange={e => setResumeId(e.target.value)}
              type="number"
            />
            <button
              className="btn btn-primary gap-2"
              onClick={runPanel}
              disabled={loading}
            >
              {loading
                ? <><span className="loading loading-spinner loading-sm" /> Running Panel…</>
                : <><Zap size={16} /> Run All 4 Agents</>
              }
            </button>
          </div>
        </div>
      </motion.div>

      {/* Loading skeletons */}
      {loading && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={stagger} initial="hidden" animate="show"
        >
          {AGENTS.map(a => (
            <motion.div key={a.key} variants={fadeUp} className="card bg-base-100 shadow-md">
              <div className="card-body p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{a.emoji}</span>
                  <span className="font-semibold">{a.label}</span>
                  <span className="loading loading-dots loading-xs ml-auto text-primary" />
                </div>
                <div className="skeleton h-4 w-full mb-2 rounded" />
                <div className="skeleton h-4 w-5/6 mb-2 rounded" />
                <div className="skeleton h-4 w-4/6 rounded" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && !loading && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={stagger} initial="hidden" animate="show"
          >
            {AGENTS.map(a => {
              const data = results[a.key];
              if (!data) return null;
              const isExpanded = expanded[a.key];
              const preview = data.response?.slice(0, 300);
              const isTruncated = (data.response?.length || 0) > 300;

              return (
                <motion.div key={a.key} variants={fadeUp}
                  className={`card bg-base-100 shadow-md border-t-4 ${a.color}`}
                >
                  <div className="card-body p-5">
                    {/* Agent header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{a.emoji}</span>
                        <div>
                          <p className="font-bold text-sm">{a.label}</p>
                          <p className="text-xs text-base-content/40">{a.desc}</p>
                        </div>
                      </div>
                      {/* Confidence bar */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-base-content/40">Confidence</span>
                        <div className="flex items-center gap-1">
                          <progress
                            className="progress progress-primary w-16 h-1.5"
                            value={data.confidence || 70}
                            max={100}
                          />
                          <span className="text-xs font-semibold">{data.confidence || 70}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Response text */}
                    <div className="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                      {isExpanded ? data.response : preview}
                      {isTruncated && !isExpanded && <span className="text-base-content/40">…</span>}
                    </div>

                    {isTruncated && (
                      <button
                        onClick={() => toggleExpand(a.key)}
                        className="btn btn-ghost btn-xs mt-2 gap-1 self-start text-primary"
                      >
                        {isExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read full review</>}
                      </button>
                    )}

                    {/* Suggestion chips */}
                    {data.suggestions?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-base-200">
                        {data.suggestions.map(s => (
                          <button key={s}
                            onClick={() => setMessage(s)}
                            className="btn btn-xs btn-ghost border border-base-300 hover:border-primary hover:text-primary text-xs">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-run */}
      {results && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex justify-center">
          <button onClick={runPanel} className="btn btn-ghost gap-2">
            <RefreshCw size={14} /> Run Again
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
