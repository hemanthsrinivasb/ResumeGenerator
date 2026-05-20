import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, RefreshCw, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { axiosInstance } from "../api/ResumeService";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

const ENDPOINTS = ["GENERATE", "AGENTS", "INTERVIEW", "WORKFLOW", "COVER_LETTER", "DIGITAL_TWIN", "MARKET"];
const HEALTH_COLOR = { EXCELLENT: "text-success", GOOD: "text-info", FAIR: "text-warning", NEEDS_IMPROVEMENT: "text-error" };
const HEALTH_BADGE = { EXCELLENT: "badge-success", GOOD: "badge-info", FAIR: "badge-warning", NEEDS_IMPROVEMENT: "badge-error" };

const ratingColor = (r) => r >= 4 ? "text-success" : r >= 3 ? "text-warning" : "text-error";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function EndpointCard({ stat, onAnalyze }) {
  const [expanded, setExpanded] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);

  const analyze = async () => {
    if (analysis) { setExpanded(p => !p); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/v1/feedback/report/${stat.endpointType}`);
      setAnalysis(res.data.analysis);
      setExpanded(true);
    } catch { toast.error("Analysis failed."); }
    finally { setLoading(false); }
  };

  return (
    <motion.div variants={fadeUp} className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{stat.endpointType}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-lg font-bold ${ratingColor(stat.avgRating)}`}>
                {stat.avgRating.toFixed(1)}<span className="text-xs text-base-content/30">/5</span>
              </span>
              <span className="text-xs text-base-content/40">{stat.count} ratings</span>
            </div>
          </div>
          <button onClick={analyze} disabled={loading} className="btn btn-ghost btn-sm gap-1">
            {loading ? <span className="loading loading-spinner loading-xs" /> : <><Zap size={14} /> Analyze</>}
            {analysis && (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
          </button>
        </div>

        <AnimatePresence>
          {expanded && analysis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-base-200 prose prose-xs max-w-none">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function AIHealth() {
  const [health,      setHealth]      = useState(null);
  const [loading,     setLoading]     = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/v1/feedback/report/system/health");
      setHealth(res.data);
    } catch { toast.error("Failed to load health report."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHealth(); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity size={24} className="text-primary" /> AI System Health
          </h1>
          <p className="text-base-content/50 text-sm mt-1">
            User feedback analysis — self-improving AI prompt quality monitoring
          </p>
        </div>
        <button onClick={fetchHealth} disabled={loading} className="btn btn-ghost btn-sm gap-1">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* System overview */}
      {health && (
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="card bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 shadow-md mb-6">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/50">Overall System Rating</p>
                <p className={`text-4xl font-bold ${HEALTH_COLOR[health.healthBadge] || "text-base-content"}`}>
                  {health.overallAvgRating}<span className="text-lg text-base-content/30">/5</span>
                </p>
              </div>
              <div className="text-right">
                <span className={`badge ${HEALTH_BADGE[health.healthBadge] || "badge-ghost"} badge-lg font-semibold`}>
                  {health.healthBadge?.replace("_", " ")}
                </span>
                <p className="text-xs text-base-content/40 mt-2">{health.totalFeedbacks} total ratings</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Per-endpoint cards */}
      {loading && !health ? (
        <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg" /></div>
      ) : (
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden" animate="show"
          className="space-y-3"
        >
          {health?.endpoints?.length > 0
            ? health.endpoints.map(stat => <EndpointCard key={stat.endpointType} stat={stat} />)
            : ENDPOINTS.map(ep => (
                <div key={ep} className="card bg-base-100 border border-base-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{ep}</p>
                    <span className="text-xs text-base-content/30">No feedback yet</span>
                  </div>
                </div>
              ))
          }
        </motion.div>
      )}
    </div>
  );
}
