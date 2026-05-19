import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaBriefcase, FaSearch, FaRobot } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";
import JobCard from "../components/JobCard";
import { getToken, isLoggedIn } from "../api/ResumeService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8050";

const JOB_CATEGORIES = ["All", "Software Dev", "DevOps / Sysadmin", "Data Science", "Product", "Design"];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState("recommend"); // "recommend" | "search"
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (isLoggedIn()) {
      loadRecommendations();
    } else {
      searchJobs("software developer");
    }
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    setMode("recommend");
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/jobs/recommend`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setJobs(res.data);
    } catch (e) {
      toast.error("Failed to load recommendations");
      searchJobs("software developer");
    } finally {
      setLoading(false);
    }
  };

  const searchJobs = async (query) => {
    const q = query || searchQuery;
    if (!q.trim()) return;
    setLoading(true);
    setMode("search");
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/jobs/search`, { params: { query: q, limit: 20 } });
      setJobs(res.data);
    } catch (e) {
      toast.error("Job search failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = filter === "All"
    ? jobs
    : jobs.filter((j) => j.category?.toLowerCase().includes(filter.toLowerCase()) ||
        j.tags?.some((t) => t.toLowerCase().includes(filter.toLowerCase())));

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl font-bold mb-2"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FaBriefcase className="inline mr-2 text-primary" />
            Job Recommendations
          </motion.h1>
          <p className="text-base-content/60">
            {mode === "recommend" && isLoggedIn()
              ? "AI-matched remote jobs based on your resume skills"
              : "Remote jobs matching your search"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search bar */}
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="Search by title or keyword…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchJobs()}
            />
            <button className="btn btn-primary gap-1" onClick={() => searchJobs()}>
              <FaSearch /> Search
            </button>
          </div>

          {/* Recommend button (logged-in only) */}
          {isLoggedIn() && (
            <button
              className={`btn gap-1 ${mode === "recommend" ? "btn-accent" : "btn-outline btn-accent"}`}
              onClick={loadRecommendations}
              disabled={loading}
            >
              <FaRobot /> Match My Resume
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {JOB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`btn btn-xs ${filter === cat ? "btn-primary" : "btn-ghost border border-base-300"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-md p-4 animate-pulse">
                <div className="h-4 bg-base-300 rounded w-2/3 mb-3" />
                <div className="h-3 bg-base-300 rounded w-1/2 mb-2" />
                <div className="h-3 bg-base-300 rounded w-3/4 mb-4" />
                <div className="h-8 bg-base-300 rounded" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 text-base-content/50">
            <FaBriefcase size={40} className="mx-auto mb-3 opacity-30" />
            <p>No jobs found. Try a different search or category.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredJobs.map((job) => (
              <motion.div key={job.id} variants={item}>
                <JobCard job={job} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <p className="text-center text-xs text-base-content/40 mt-6">
          Jobs sourced from Remotive · {filteredJobs.length} results shown
        </p>
      </div>
    </div>
  );
}
