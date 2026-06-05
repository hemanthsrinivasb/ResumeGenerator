import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBrain, 
  FaTrash, 
  FaDownload, 
  FaShare, 
  FaPlus, 
  FaSearch, 
  FaRegFileAlt, 
  FaCalendarAlt, 
  FaChartLine, 
  FaLink,
  FaSignOutAlt,
  FaKey
} from "react-icons/fa";
import { BiHistory } from "react-icons/bi";
import { getResumeHistory, deleteResume, getUser, logout, isLoggedIn } from "../api/ResumeService";
import ApiKeysModal from "../components/ApiKeysModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showKeysModal, setShowKeysModal] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) { 
      navigate("/login"); 
      return; 
    }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getResumeHistory();
      setHistory(data || []);
    } catch {
      toast.error("Failed to load resume history");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteResume(id);
      setHistory((prev) => prev.filter((r) => r.id !== id));
      toast.success("Resume deleted successfully");
    } catch {
      toast.error("Failed to delete resume");
    }
  };

  const handleShare = (shareCode) => {
    const url = `${window.location.origin}/share/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });

  const filteredHistory = history.filter(resume => 
    resume.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Welcome / Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
        <div>
          <span className="text-primary text-xs font-semibold uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Developer Workspace
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mt-2 text-gradient-glow">
            Welcome back, {user?.name || "User"}
          </h1>
          <p className="text-slate-400 mt-2 font-light">
            Manage your AI resumes, check match analytics, and track application workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/generate-resume" 
            className="btn btn-theme-inverse hover:scale-105 active:scale-95 transition-all rounded-2xl h-12 px-6"
          >
            <FaPlus className="mr-2" /> Create Resume
          </Link>
          <button 
            onClick={() => setShowKeysModal(true)} 
            className="btn btn-outline border-primary/30 hover:border-primary hover:bg-primary/10 text-primary hover:text-white rounded-2xl h-12 px-5 text-slate-300"
          >
            <FaKey className="mr-2" /> API Keys
          </button>
          <button 
            onClick={handleLogout} 
            className="btn btn-ghost hover:bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl h-12 px-5 text-slate-300"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
      >
        <motion.div variants={itemVariants} className="card glass-panel card-glow p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Resumes</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{history.length}</h3>
            </div>
            <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center border border-primary/20">
              <FaRegFileAlt className="text-primary text-xl" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 font-light">
            Stored securely in your cloud workspace.
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card glass-panel card-glow p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Active Twin Status</p>
              <h3 className="text-lg font-bold mt-2 text-success flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Synchronized
              </h3>
            </div>
            <div className="w-12 h-12 bg-success/15 rounded-2xl flex items-center justify-center border border-success/20">
              <FaBrain className="text-success text-xl" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 font-light">
            Digital twin profile matching active.
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card glass-panel card-glow p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Match Analytics</p>
              <h3 className="text-3xl font-bold mt-1 text-secondary">88%</h3>
            </div>
            <div className="w-12 h-12 bg-secondary/15 rounded-2xl flex items-center justify-center border border-secondary/20">
              <FaChartLine className="text-secondary text-xl" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 font-light">
            Average compatibility across targets.
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card glass-panel card-glow p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Shared Profiles</p>
              <h3 className="text-3xl font-bold mt-1 text-accent">
                {history.filter(r => r.shareCode).length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-accent/15 rounded-2xl flex items-center justify-center border border-accent/20">
              <FaLink className="text-accent text-xl" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 font-light">
            Resumes public via custom code links.
          </div>
        </motion.div>
      </motion.div>

      {/* Main Section Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <BiHistory className="text-secondary text-2xl" />
          <h2 className="text-2xl font-bold text-white">Your Documents</h2>
          <span className="badge bg-white/5 border border-white/10 text-slate-300 ml-2 rounded-lg py-3 px-2 text-xs">
            {filteredHistory.length}
          </span>
        </div>

        {history.length > 0 && (
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <FaSearch className="text-sm" />
            </span>
            <input
              type="text"
              placeholder="Search resumes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-9 pr-4 rounded-2xl bg-white/5 border-white/10 text-white placeholder-slate-400 focus:border-primary/50 focus:outline-none text-sm h-10 transition-colors"
            />
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <span className="loading loading-ring loading-lg text-primary mb-4" />
          <p className="text-slate-400 text-sm font-light">Loading resume portfolio...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && history.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 glass-panel rounded-3xl max-w-xl mx-auto border border-white/5"
        >
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
            <FaRegFileAlt className="text-3xl" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No Saved Resumes Yet</h3>
          <p className="text-slate-400 font-light max-w-sm mx-auto mb-8 leading-relaxed">
            Create an ATS-optimized, high-fidelity resume customized for your next career trajectory.
          </p>
          <Link 
            to="/generate-resume" 
            className="btn btn-theme-inverse hover:scale-105 active:scale-95 transition-all rounded-2xl px-6 h-12"
          >
            <FaPlus className="mr-2" /> Compose First Resume
          </Link>
        </motion.div>
      )}

      {/* Grid of Resumes */}
      {!loading && history.length > 0 && (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredHistory.map((resume) => (
              <motion.div
                key={resume.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="card glass-panel card-glow rounded-3xl overflow-hidden"
              >
                <div className="card-body p-6 flex flex-col justify-between h-52 relative">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="card-title text-lg font-bold text-white leading-snug truncate pr-6">
                        {resume.title}
                      </h3>
                      <span className="badge bg-primary/10 border-primary/25 text-primary text-[10px] rounded-lg">
                        AI Build
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
                      <FaCalendarAlt className="text-[10px]" />
                      Created {formatDate(resume.createdAt)}
                    </p>
                  </div>

                  <div className="card-actions justify-between items-center mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => navigate("/generate-resume", { state: { resumeId: resume.id } })}
                      className="btn btn-primary btn-sm rounded-xl px-4 h-9 shadow-md shadow-primary/10 hover:scale-105 transition-transform"
                    >
                      <FaDownload className="mr-1.5 text-[10px]" /> Load
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {resume.shareCode && (
                        <button
                          onClick={() => handleShare(resume.shareCode)}
                          className="btn btn-square btn-outline btn-sm rounded-xl hover:bg-info/10 text-info hover:text-info hover:border-info border-white/10"
                          title="Copy Share Link"
                        >
                          <FaShare className="text-xs" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(resume.id, resume.title)}
                        className="btn btn-square btn-outline btn-sm rounded-xl hover:bg-error/10 text-error hover:text-error hover:border-error border-white/10"
                        title="Delete Document"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* No results on filter */}
      {!loading && history.length > 0 && filteredHistory.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-400 font-light">No resumes match "{searchTerm}"</p>
        </div>
      )}

      <ApiKeysModal isOpen={showKeysModal} onClose={() => setShowKeysModal(false)} />
    </motion.div>
  );
};

export default Dashboard;
