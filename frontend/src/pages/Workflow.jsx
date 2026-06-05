import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Search, 
  Compass, 
  FileText, 
  CheckSquare, 
  Calendar, 
  History, 
  Clipboard,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { getToken, baseURLL } from '../api/ResumeService';

const STEPS = [
  { 
    key: 'gapAnalysis',     
    label: 'Gap Analysis',       
    icon: <Search size={18} />, 
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/20',
    bgColor: 'bg-indigo-500/10',
    desc: 'Identifying critical skill & experience gaps' 
  },
  { 
    key: 'learningRoadmap', 
    label: 'Learning Roadmap',   
    icon: <Compass size={18} />, 
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    bgColor: 'bg-emerald-500/10',
    desc: 'Customized learning resources & target skills' 
  },
  { 
    key: 'rewrittenResume', 
    label: 'Resume Rewrite',     
    icon: <FileText size={18} />, 
    color: 'text-pink-400',
    borderColor: 'border-pink-500/20',
    bgColor: 'bg-pink-500/10',
    desc: 'ATS-optimized outline generated for target roles' 
  },
  { 
    key: 'interviewPrep',   
    label: 'Interview Prep',     
    icon: <CheckSquare size={18} />, 
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/10',
    desc: 'Core topics & mock interview sample questions' 
  },
  { 
    key: 'masterTimeline',  
    label: 'Master Timeline',    
    icon: <Calendar size={18} />, 
    color: 'text-violet-400',
    borderColor: 'border-violet-500/20',
    bgColor: 'bg-violet-500/10',
    desc: 'Milestones & biweekly objectives timeline' 
  },
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
    baseURL: `${baseURLL}/api/v1`,
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
    <div className="bg-transparent py-6 px-4 relative z-10">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-1">
            <Zap size={13} className="animate-pulse" />
            <span>AUTONOMOUS ROADMAP ENGINE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient-glow">
            Career Workflow Roadmap
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Input your career objective and resume JSON. The agent will formulate custom gaps, roadmaps, and interview preparations.
          </p>
        </motion.div>

        {/* Input Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="glass-panel card-glow p-6 md:p-8 rounded-3xl space-y-6"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Target Career Goal *</label>
              <textarea
                className="w-full p-4 rounded-2xl bg-slate-950/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm h-24 resize-none"
                placeholder='e.g. "Get a Senior Backend Engineer role at Google in 6 months" or "Transition to ML Engineering at a Series B startup"'
                value={goalText}
                onChange={e => setGoalText(e.target.value)}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Current Resume JSON <span className="text-slate-500 text-xxs font-normal lowercase">(optional &bull; copy from dashboard)</span>
              </label>
              <textarea
                className="w-full p-4 rounded-2xl bg-slate-950/40 border border-white/10 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-xs h-20 resize-none font-mono"
                placeholder='{"name": "Jane Doe", "skills": ["Java", "Spring Boot"], ...}'
                value={resumeJson}
                onChange={e => setResumeJson(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50"
              onClick={runWorkflow}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Generating Complete Blueprint…</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Activate Career Blueprint</span>
                </>
              )}
            </button>
            <button 
              className="px-5 py-3.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 font-medium flex items-center justify-center gap-2 transition-all" 
              onClick={loadHistory}
            >
              <History size={16} />
              <span>History</span>
            </button>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="glass-panel p-6 rounded-3xl space-y-6"
            >
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Sparkles size={16} className="animate-pulse" />
                <span>AI Agent is mapping out career progression targets:</span>
              </div>
              
              <div className="relative pl-6 space-y-6 border-l border-white/10 ml-3">
                {STEPS.map((step, i) => {
                  const isDone = i < progress;
                  const isActive = i === progress;
                  const isPending = i > progress;
                  
                  return (
                    <div 
                      key={step.key} 
                      className={`relative flex items-start gap-4 transition-all duration-500 ${
                        isPending ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      {/* Node Bullet */}
                      <span className="absolute -left-9 top-1 w-6 h-6 rounded-full flex items-center justify-center bg-slate-950 border border-white/10 z-10">
                        {isDone ? (
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        ) : isActive ? (
                          <Loader2 size={14} className="text-primary animate-spin" />
                        ) : (
                          <Circle size={10} className="text-slate-600" />
                        )}
                      </span>
                      
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg border ${step.borderColor} ${step.bgColor} ${step.color}`}>
                            {step.icon}
                          </span>
                          <p className="text-sm font-semibold text-white">{step.label}</p>
                        </div>
                        <p className="text-xs text-slate-400 pl-8">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Accordion */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="space-y-5"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <CheckCircle2 size={18} />
                <span>Active Target Blueprint: <em className="text-white not-italic font-semibold font-mono ml-1">"{result.goalText}"</em></span>
              </div>

              {STEPS.map((step, i) => {
                const isOpen = open[step.key];
                return (
                  <motion.div 
                    key={step.key}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}
                    className={`glass-panel border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isOpen ? 'border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-white/5'
                    }`}
                  >
                    <button
                      className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all text-left"
                      onClick={() => toggle(step.key)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-xl border ${step.borderColor} ${step.bgColor} ${step.color} shadow-sm`}>
                          {step.icon}
                        </span>
                        <div>
                          <p className="font-bold text-white text-base">{step.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden bg-slate-950/20"
                        >
                          <div className="px-6 pb-6 pt-2 border-t border-white/5">
                            <div className="prose prose-invert prose-slate prose-sm max-w-none text-slate-300 leading-relaxed space-y-4 pt-4">
                              <ReactMarkdown>{result[step.key] || '_No content generated._'}</ReactMarkdown>
                            </div>
                            
                            {step.key === 'rewrittenResume' && (
                              <div className="mt-6 flex justify-end">
                                <button
                                  className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                                  onClick={() => { 
                                    navigator.clipboard.writeText(result.rewrittenResume); 
                                    toast.success('Copied rewritten resume details!'); 
                                  }}
                                >
                                  <Clipboard size={14} />
                                  <span>Copy Target Resume Outline</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowHistory(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.95, y: 15 }}
                className="bg-[#0b0f1d] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <History size={18} className="text-primary" />
                    Workflow Sessions History
                  </h3>
                  <button className="text-xs text-slate-400 hover:text-white" onClick={() => setShowHistory(false)}>Close</button>
                </div>
                
                {sessions.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No historical roadmaps generated yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {sessions.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => loadSession(s.id)}
                        className="w-full text-left p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-primary/30 hover:bg-slate-900 transition-all flex items-center justify-between gap-4 group"
                      >
                        <div className="truncate space-y-1">
                          <p className="font-semibold text-sm text-white truncate group-hover:text-primary transition-colors">{s.goalText}</p>
                          <p className="text-xxs text-slate-500">{new Date(s.createdAt).toLocaleString()}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-600 group-hover:text-primary transition-all group-hover:translate-x-1 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state hint */}
        {!loading && !result && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            className="text-center py-12 space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-300">No Blueprint Active</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Define a target objective and trigger the agent workflow to start compiling gaps, milestones, and timelines.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
