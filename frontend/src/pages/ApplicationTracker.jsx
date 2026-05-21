import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Plus, X, ExternalLink, FileText, Mail, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { axiosInstance } from "../api/ResumeService";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

const COLUMNS = [
  { key: "SAVED",     label: "Saved",     color: "badge-ghost",   border: "border-base-300",    bg: "bg-base-200/50" },
  { key: "APPLIED",   label: "Applied",   color: "badge-info",    border: "border-info/30",     bg: "bg-info/5"      },
  { key: "INTERVIEW", label: "Interview", color: "badge-warning", border: "border-warning/30",  bg: "bg-warning/5"   },
  { key: "OFFER",     label: "Offer",     color: "badge-success", border: "border-success/30",  bg: "bg-success/5"   },
  { key: "REJECTED",  label: "Rejected",  color: "badge-error",   border: "border-error/30",    bg: "bg-error/5"     },
];

const STATUS_TRANSITIONS = {
  SAVED:     ["APPLIED", "REJECTED"],
  APPLIED:   ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER:     [],
  REJECTED:  ["SAVED"],
};

function AddModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ company: "", role: "", jobUrl: "", jobDescription: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.company.trim() || !form.role.trim()) { toast.error("Company and Role are required."); return; }
    setLoading(true);
    try {
      await axiosInstance.post("/api/v1/job-applications", form);
      toast.success("Application saved!");
      onAdded();
      onClose();
    } catch { toast.error("Failed to save application."); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg"
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
      >
        <div className="p-5 border-b border-base-200 flex items-center justify-between">
          <h2 className="font-bold text-lg">Add Application</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label py-1"><span className="label-text text-xs font-semibold">Company *</span></label>
              <input className="input input-bordered input-sm w-full" placeholder="Google"
                value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div>
              <label className="label py-1"><span className="label-text text-xs font-semibold">Role *</span></label>
              <input className="input input-bordered input-sm w-full" placeholder="Software Engineer"
                value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label py-1"><span className="label-text text-xs font-semibold">Job URL</span></label>
            <input className="input input-bordered input-sm w-full" placeholder="https://..."
              value={form.jobUrl} onChange={e => setForm(p => ({ ...p, jobUrl: e.target.value }))} />
          </div>
          <div>
            <label className="label py-1"><span className="label-text text-xs font-semibold">Job Description (for AI features)</span></label>
            <textarea className="textarea textarea-bordered textarea-sm w-full h-24 resize-none"
              placeholder="Paste the full job description here…"
              value={form.jobDescription} onChange={e => setForm(p => ({ ...p, jobDescription: e.target.value }))} />
          </div>
          <div>
            <label className="label py-1"><span className="label-text text-xs font-semibold">Notes</span></label>
            <input className="input input-bordered input-sm w-full" placeholder="Recruiter name, referral, etc."
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        <div className="p-5 border-t border-base-200 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn btn-primary btn-sm">
            {loading ? <span className="loading loading-spinner loading-xs" /> : <Plus size={14} />} Save Application
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AiResultModal({ title, content, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
      >
        <div className="p-4 border-b border-base-200 flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><X size={16} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        <div className="p-4 border-t border-base-200 flex justify-between">
          <button onClick={() => navigator.clipboard.writeText(content).then(() => toast.success("Copied!"))}
            className="btn btn-ghost btn-sm">Copy</button>
          <button onClick={onClose} className="btn btn-primary btn-sm">Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function KanbanCard({ card, onStatusChange, onAiAction, loading }) {
  const [expanded, setExpanded] = useState(false);
  const transitions = STATUS_TRANSITIONS[card.status] || [];

  return (
    <motion.div
      layout
      className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-3 cursor-default"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{card.company}</p>
          <p className="text-xs text-base-content/50 truncate">{card.role}</p>
        </div>
        {card.jobUrl && (
          <a href={card.jobUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs btn-circle flex-shrink-0">
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {card.appliedAt && (
        <p className="text-xs text-base-content/40 mt-1">Applied {new Date(card.appliedAt).toLocaleDateString()}</p>
      )}

      <div className="flex gap-1 mt-2 flex-wrap">
        {card.hasTailored   && <span className="badge badge-xs badge-success">Tailored</span>}
        {card.hasCoverLetter && <span className="badge badge-xs badge-info">Cover Letter</span>}
        {!card.hasJobDescription && <span className="badge badge-xs badge-ghost">No JD</span>}
      </div>

      {/* Expand / collapse actions */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="btn btn-ghost btn-xs gap-1 mt-2 w-full"
      >
        Actions {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1">
              {/* Status transitions */}
              {transitions.map(s => (
                <button key={s} onClick={() => onStatusChange(card.id, s)} disabled={loading}
                  className="btn btn-xs btn-outline w-full">
                  Move to {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
              {/* AI actions */}
              <button onClick={() => onAiAction(card.id, "tailor")} disabled={loading || !card.hasJobDescription}
                className="btn btn-xs btn-ghost w-full gap-1 justify-start">
                <FileText size={11} /> Tailor Resume
              </button>
              <button onClick={() => onAiAction(card.id, "cover-letter")} disabled={loading || !card.hasJobDescription}
                className="btn btn-xs btn-ghost w-full gap-1 justify-start">
                <Mail size={11} /> Cover Letter
              </button>
              {card.status === "REJECTED" && (
                <button onClick={() => onAiAction(card.id, "analyze-rejection")} disabled={loading}
                  className="btn btn-xs btn-ghost w-full gap-1 justify-start text-error">
                  <AlertCircle size={11} /> Analyze Rejection
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ApplicationTracker() {
  const [board,       setBoard]      = useState({});
  const [total,       setTotal]      = useState(0);
  const [loading,     setLoading]    = useState(false);
  const [aiLoading,   setAiLoading]  = useState(false);
  const [showAdd,     setShowAdd]    = useState(false);
  const [aiModal,     setAiModal]    = useState(null); // { title, content }

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/v1/job-applications/board");
      setBoard(res.data.board || {});
      setTotal(res.data.total || 0);
    } catch { toast.error("Failed to load applications."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBoard(); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await axiosInstance.patch(`/api/v1/job-applications/${id}/status`, { status });
      toast.success(`Moved to ${status.charAt(0) + status.slice(1).toLowerCase()}`);
      fetchBoard();
    } catch { toast.error("Failed to update status."); }
  };

  const handleAiAction = async (id, action) => {
    setAiLoading(true);
    try {
      let res;
      if (action === "tailor") {
        res = await axiosInstance.post(`/api/v1/job-applications/${id}/tailor`, { baseResumeJson: "{}" });
        setAiModal({ title: "Tailored Resume", content: res.data.tailoredResume || JSON.stringify(res.data) });
      } else if (action === "cover-letter") {
        res = await axiosInstance.post(`/api/v1/job-applications/${id}/cover-letter`, { baseResumeJson: "{}" });
        setAiModal({ title: "Cover Letter", content: res.data.coverLetter || JSON.stringify(res.data) });
      } else if (action === "analyze-rejection") {
        res = await axiosInstance.post(`/api/v1/job-applications/${id}/analyze-rejection`, { baseResumeJson: "{}" });
        setAiModal({ title: "Rejection Analysis", content: res.data.analysis || JSON.stringify(res.data) });
      }
    } catch { toast.error("AI action failed."); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase size={24} className="text-primary" /> Job Application Tracker
          </h1>
          <p className="text-base-content/50 text-sm mt-1">{total} total applications</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm gap-2">
          <Plus size={16} /> Add Application
        </button>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLUMNS.map(col => {
            const cards = board[col.key] || [];
            return (
              <div key={col.key} className={`rounded-2xl border ${col.border} ${col.bg} p-3 min-h-48`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${col.color} font-semibold`}>{col.label}</span>
                  <span className="text-xs text-base-content/40">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {cards.map(card => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        onStatusChange={handleStatusChange}
                        onAiAction={handleAiAction}
                        loading={aiLoading}
                      />
                    ))}
                  </AnimatePresence>
                  {cards.length === 0 && (
                    <p className="text-xs text-base-content/30 text-center py-4">No applications</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={fetchBoard} />}
        {aiModal  && <AiResultModal title={aiModal.title} content={aiModal.content} onClose={() => setAiModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
