import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, ChevronUp, Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { getToken } from '../api/ResumeService';

const STEPS = [
  { key: 'gapAnalysis',     label: 'Gap Analysis',       icon: '🔍', desc: 'Identifying skill & experience gaps' },
  { key: 'learningRoadmap', label: 'Learning Roadmap',   icon: '🗺️', desc: 'Week-by-week learning plan' },
  { key: 'rewrittenResume', label: 'Resume Rewrite',     icon: '📄', desc: 'ATS-optimised resume for your goal' },
  { key: 'interviewPrep',   label: 'Interview Prep',     icon: '🎯', desc: 'Topic-by-topic question bank' },
  { key: 'masterTimeline',  label: 'Master Timeline',    icon: '📅', desc: '6-month action plan with milestones' },
];

export default function Workflow() {
  const [goalText, setGoalText]     = useState('');
  const [resumeJson, setResumeJson] = useState('');
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(-1); // 0-4 = which step completed
  const [result, setResult]         = useState(null);
  const [open, setOpen]             = useState({});
  const [sessions, setSessions]     = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const api = axios.create({
    baseURL: '/api/v1',
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const runWorkflow = async () => {
    if (!goalText.trim()) { toast.error('Please enter your career goal'); return; }
    setLoading(true);
    setProgress(0);
    setResult(null);

    // Simulate per-step progress while waiting for the full response
    const timer = setInterval(() => {
      setProgress(p => (p < 4 ? p + 1 : p));
    }, 6000);

    try {
      const { data } = await api.post('/workflow/create', { goalText, resumeJson });
      clearInterval(timer);
      setProgress(5); // all done
      setResult(data);
      setOpen({ gapAnalysis: true }); // open first step by default
      toast.success('Career workflow generated!');
    } catch {
      clearInterval(timer);
      setProgress(-1);
      toast.error('Workflow generation failed. Make sure the AI server is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/workflow/sessions');
      setSessions(data);
      setShowHistory(true);
    } catch { toast.error('Failed to load history'); }
  };

  const loadSession = async (id) => {
    try {
      const { data } = await api.get(`/workflow/sessions/${id}`);
      setResult(data);
      setGoalText(data.goalText);
      setProgress(5);
      setOpen({ gapAnalysis: true });
      setShowHistory(false);
    } catch { toast.error('Failed to load session'); }
  };

  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Zap className="text-primary" size={36} />
            <h1 className="text-4xl font-bold">Career Workflow Engine</h1>
          </div>
          <p className="text-base-content/60 text-lg">State your career goal. AI autonomously builds your complete roadmap.</p>
        </motion.div>

        {/* Input Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="card bg-base-100 shadow-xl">
          <div className="card-body space-y-4">
            <div>
              <label className="label"><span className="label-text font-semibold text-base">Your Career Goal</span></label>
              <textarea
                className="textarea textarea-bordered w-full text-sm h-24 resize-none"
                placeholder='e.g. "Get a Senior Backend Engineer role at Google in 6 months" or "Transition to ML Engineering at a Series B startup"'
                value={goalText}
                onChange={e => setGoalText(e.target.value)}
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text font-semibold text-base">Current Resume JSON <span className="text-base-content/40 font-normal">(optional — paste from Dashboard → Export)</span></span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full text-xs h-20 resize-none font-mono"
                placeholder='{"name":"...","skills":["..."],...}'
                value={resumeJson}
                onChange={e => setResumeJson(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="btn btn-primary flex-1 gap-2"
                onClick={runWorkflow}
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                {loading ? 'AI is working…' : 'Activate Career Workflow'}
              </button>
              <button className="btn btn-ghost gap-2" onClick={loadHistory}>
                📂 History
              </button>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="card bg-base-100 shadow-md">
              <div className="card-body py-5">
                <p className="font-semibold text-center text-sm mb-4">AI is running 5 analysis steps…</p>
                <div className="space-y-3">
                  {STEPS.map((step, i) => (
                    <div key={step.key} className={`flex items-center gap-3 transition-all duration-500 ${i > progress ? 'opacity-30' : ''}`}>
                      {i < progress
                        ? <CheckCircle2 size={20} className="text-success shrink-0" />
                        : i === progress
                        ? <Loader2 size={20} className="text-primary animate-spin shrink-0" />
                        : <Circle size={20} className="text-base-content/20 shrink-0" />}
                      <div>
                        <p className="text-sm font-medium">{step.icon} {step.label}</p>
                        <p className="text-xs text-base-content/50">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-2 text-success font-semibold">
                <CheckCircle2 size={20} />
                <span>Workflow complete for: <em className="text-base-content">"{result.goalText}"</em></span>
              </div>

              {STEPS.map((step, i) => (
                <motion.div key={step.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}
                  className="card bg-base-100 shadow-md border border-base-200">
                  <button
                    className="card-body py-4 flex flex-row items-center gap-3 w-full text-left hover:bg-base-200/50 transition-colors rounded-2xl"
                    onClick={() => toggle(step.key)}
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold">{step.label}</p>
                      <p className="text-xs text-base-content/50">{step.desc}</p>
                    </div>
                    {open[step.key] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <AnimatePresence>
                    {open[step.key] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 prose prose-sm max-w-none">
                          <ReactMarkdown>{result[step.key] || '_No content generated._'}</ReactMarkdown>
                        </div>
                        {step.key === 'rewrittenResume' && (
                          <div className="px-6 pb-4">
                            <button
                              className="btn btn-sm btn-outline btn-primary"
                              onClick={() => { navigator.clipboard.writeText(result.rewrittenResume); toast.success('Copied to clipboard!'); }}
                            >
                              📋 Copy Rewritten Resume
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowHistory(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg p-6"
                onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">Workflow History</h3>
                {sessions.length === 0
                  ? <p className="text-base-content/50 text-sm">No workflows yet.</p>
                  : <div className="space-y-2 max-h-80 overflow-y-auto">
                    {sessions.map(s => (
                      <button key={s.id} onClick={() => loadSession(s.id)}
                        className="w-full text-left p-3 rounded-xl hover:bg-base-200 transition-colors border border-base-200">
                        <p className="font-medium text-sm truncate">{s.goalText}</p>
                        <p className="text-xs text-base-content/40">{new Date(s.createdAt).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>}
                <button className="btn btn-ghost btn-sm mt-4" onClick={() => setShowHistory(false)}>Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state hint */}
        {!loading && !result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }}
            className="text-center py-12 text-base-content/30">
            <AlertCircle size={40} className="mx-auto mb-3" />
            <p className="text-sm">Enter your career goal above and let AI build your complete 6-month roadmap.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
