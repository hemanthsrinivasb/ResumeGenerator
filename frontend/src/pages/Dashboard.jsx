import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import toast from "react-hot-toast";
import { FaBrain, FaTrash, FaDownload, FaShare, FaPlus, FaSignOutAlt } from "react-icons/fa";
import { BiHistory } from "react-icons/bi";
import { getResumeHistory, deleteResume, getUser, logout, isLoggedIn } from "../api/ResumeService";

const Dashboard = () => {
  const navigate = useNavigate();
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getResumeHistory();
      setHistory(data);
    } catch {
      toast.error("Failed to load resume history");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteResume(id);
      setHistory((prev) => prev.filter((r) => r.id !== id));
      toast.success("Resume deleted");
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
    toast.success("Logged out");
    navigate("/login");
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-md px-6">
        <div className="flex-1 flex items-center gap-2">
          <FaBrain className="text-primary text-2xl" />
          <span className="text-xl font-bold">AI Resume Builder</span>
        </div>
        <div className="flex-none flex items-center gap-3">
          <span className="text-sm text-base-content/70 hidden sm:block">
            👋 {user?.name}
          </span>
          <Link to="/generate-resume" className="btn btn-primary btn-sm gap-1">
            <FaPlus /> New Resume
          </Link>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm gap-1">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <BiHistory className="text-accent text-2xl" />
          <h1 className="text-3xl font-bold">My Resumes</h1>
          <span className="badge badge-neutral ml-2">{history.length}</span>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="text-center py-20">
            <FaBrain className="text-6xl text-base-content/20 mx-auto mb-4" />
            <p className="text-xl text-base-content/50 mb-4">No saved resumes yet</p>
            <Link to="/generate-resume" className="btn btn-primary">
              <FaPlus /> Generate Your First Resume
            </Link>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((resume) => (
              <div key={resume.id} className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <h2 className="card-title text-base font-bold truncate">{resume.title}</h2>
                  <p className="text-xs text-base-content/50">{formatDate(resume.createdAt)}</p>

                  <div className="card-actions justify-end mt-4 gap-2 flex-wrap">
                    <button
                      onClick={() => navigate("/generate-resume", { state: { resumeId: resume.id } })}
                      className="btn btn-sm btn-primary gap-1"
                    >
                      <FaDownload /> Load
                    </button>
                    {resume.shareCode && (
                      <button
                        onClick={() => handleShare(resume.shareCode)}
                        className="btn btn-sm btn-outline btn-info gap-1"
                      >
                        <FaShare /> Share
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(resume.id, resume.title)}
                      className="btn btn-sm btn-outline btn-error gap-1"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
