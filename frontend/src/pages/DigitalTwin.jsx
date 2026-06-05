import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Loader2, TrendingUp, CheckCircle, XCircle, ArrowRight, DollarSign, Award, Lightbulb, Activity } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getToken, baseURLL } from '../api/ResumeService';

const api = () => axios.create({
  baseURL: `${baseURLL}/api/v1`,
  headers: { Authorization: `Bearer ${getToken()}` },
});

const GaugeChart = ({ value, color, label }) => {
  const data = [{ name: label, value, fill: color }];
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="75%" 
            outerRadius="100%"
            startAngle={225} 
            endAngle={-45} 
            data={data}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }} dataKey="value" angleAxisId={0} cornerRadius={12} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight" style={{ color }}>
            {value}%
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">
            Score
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-300 mt-4 text-center">{label}</p>
    </div>
  );
};

const decisionColor = (d) => ({
  STRONG_YES: 'bg-success/15 text-success border-success/20', 
  YES: 'bg-success/15 text-success border-success/20',
  MAYBE: 'bg-warning/15 text-warning border-warning/20', 
  NO: 'bg-error/15 text-error border-error/20',
})[d] || 'bg-white/5 text-slate-300 border-white/10';

const yearColor = [
  'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400', 
  'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400', 
  'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400'
];

export default function DigitalTwin() {
  const [resumeJson, setResumeJson] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [trajLoading, setTrajLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [trajResult, setTrajResult] = useState(null);
  const [activeTab, setActiveTab] = useState('simulate');

  const runSimulation = async () => {
    if (!targetRole.trim()) { toast.error('Enter a target role'); return; }
    setSimLoading(true);
    setSimResult(null);
    try {
      const { data } = await api().post('/career-twin/simulate', { resumeJson, targetRole, targetCompany });
      setSimResult(data);
      toast.success('Hiring simulation complete!');
    } catch { 
      toast.error('Simulation failed. Check your AI server.'); 
    } finally { 
      setSimLoading(false); 
    }
  };

  const runTrajectory = async () => {
    setTrajLoading(true);
    setTrajResult(null);
    try {
      const { data } = await api().post('/career-twin/trajectory', { resumeJson });
      setTrajResult(data);
      toast.success('Career trajectory predicted!');
    } catch { 
      toast.error('Trajectory prediction failed.'); 
    } finally { 
      setTrajLoading(false); 
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="space-y-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center max-w-2xl mx-auto"
        >
          <span className="text-primary text-xs font-semibold uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Cognitive Diagnostics
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mt-3 text-gradient-glow flex items-center justify-center gap-2">
            🧬 AI Career Twin
          </h1>
          <p className="text-slate-400 mt-2 font-light text-sm sm:text-base leading-relaxed">
            Simulate mock recruitment evaluations using automated cognitive diagnostic tools and map your long-term occupational trajectory.
          </p>
        </motion.div>

        {/* Resume Input Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-panel p-6 rounded-3xl"
        >
          <h2 className="text-sm font-bold mb-3 text-slate-200 flex items-center gap-2">
            <Activity className="text-primary text-xs" size={16} />
            Workspace Context (Optional JSON)
          </h2>
          <textarea 
            className="textarea w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none text-xs font-mono resize-none transition-all leading-relaxed h-20"
            placeholder='{"name": "Jane Doe", "skills": ["React", "Spring Boot"], "experience": []}'
            value={resumeJson} 
            onChange={e => setResumeJson(e.target.value)} 
          />
          <p className="text-[10px] text-slate-500 mt-1 font-light pl-1">
            Copy the structured JSON from your Resume Workspace Export to simulate personalized outcomes.
          </p>
        </motion.div>

        {/* Tabs Controller */}
        <div className="flex justify-center items-center gap-2 bg-white/[0.02] border border-white/5 p-2 rounded-2xl shadow-inner max-w-sm mx-auto">
          <button 
            className={`btn btn-sm flex-1 capitalize rounded-xl h-9 border-none transition-all ${
              activeTab === 'simulate' 
                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/10" 
                : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`} 
            onClick={() => setActiveTab('simulate')}
          >
            🎭 Hiring Simulation
          </button>
          <button 
            className={`btn btn-sm flex-1 capitalize rounded-xl h-9 border-none transition-all ${
              activeTab === 'trajectory' 
                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/10" 
                : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`} 
            onClick={() => setActiveTab('trajectory')}
          >
            📈 Career Trajectory
          </button>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'simulate' ? (
            <motion.div 
              key="simulate" 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Form Card */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="form-control w-full">
                    <label className="label py-1">
                      <span className="label-text text-slate-300 font-medium text-xs sm:text-sm">Target Role *</span>
                    </label>
                    <input 
                      type="text"
                      className="input rounded-xl w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-all h-11 px-4 text-sm" 
                      placeholder="e.g. Lead Kubernetes Architect"
                      value={targetRole} 
                      onChange={e => setTargetRole(e.target.value)} 
                    />
                  </div>
                  <div className="form-control w-full">
                    <label className="label py-1">
                      <span className="label-text text-slate-300 font-medium text-xs sm:text-sm">Target Company</span>
                    </label>
                    <input 
                      type="text"
                      className="input rounded-xl w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-all h-11 px-4 text-sm" 
                      placeholder="e.g. OpenAI, Stripe, Netflix"
                      value={targetCompany} 
                      onChange={e => setTargetCompany(e.target.value)} 
                    />
                  </div>
                </div>
                
                <button 
                  className="btn bg-gradient-to-r from-primary to-secondary text-white border-none hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-xl w-full h-11 text-xs sm:text-sm font-semibold shadow-lg shadow-primary/10" 
                  onClick={runSimulation} 
                  disabled={simLoading}
                >
                  {simLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" /> Simulating hiring workflow...
                    </>
                  ) : (
                    'Run Interview Simulator'
                  )}
                </button>
              </div>

              {/* Simulation Result Details */}
              <AnimatePresence>
                {simResult && (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    {/* Scores Glass Panel */}
                    <motion.div variants={itemVariants} className="glass-panel p-6 sm:p-8 rounded-3xl">
                      <h3 className="text-lg font-bold text-white mb-6 text-center sm:text-left">
                        Cognitive Simulation Outcomes
                      </h3>
                      
                      <div className="flex flex-col sm:flex-row justify-center items-center gap-12 border-b border-white/5 pb-8">
                        <GaugeChart value={simResult.shortlistProbability} color="#818cf8" label="Shortlist Compatibility" />
                        <GaugeChart value={simResult.marketReadiness} color="#34d399" label="Market Readiness" />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mt-6">
                        <span className={`badge badge-lg border py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider ${decisionColor(simResult.hiringDecision)}`}>
                          Decision: {simResult.hiringDecision}
                        </span>
                        <p className="text-xs text-slate-400 font-light text-center sm:text-left leading-relaxed">
                          {simResult.decisionReason}
                        </p>
                      </div>
                    </motion.div>

                    {/* Strengths & Gaps */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-panel p-6 rounded-3xl border border-success/10 bg-success/[0.01]">
                        <h4 className="font-bold text-success text-base flex items-center gap-2 mb-4">
                          <CheckCircle size={18} /> Top Strengths
                        </h4>
                        <ul className="space-y-3">
                          {simResult.strengths?.map((s, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-light">
                              <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="glass-panel p-6 rounded-3xl border border-error/10 bg-error/[0.01]">
                        <h4 className="font-bold text-error text-base flex items-center gap-2 mb-4">
                          <XCircle size={18} /> Critical Gaps
                        </h4>
                        <ul className="space-y-3">
                          {simResult.gaps?.map((g, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-light">
                              <span className="w-1.5 h-1.5 rounded-full bg-error mt-2 shrink-0" />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>

                    {/* Salary & Improvements Panels */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-panel p-6 rounded-3xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Salary Range Estimate</p>
                          <p className="font-bold text-lg text-white mt-0.5">{simResult.salaryRange || "$120k - $150k"}</p>
                        </div>
                      </div>
                      
                      <div className="glass-panel p-6 rounded-3xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent shrink-0">
                          <Lightbulb size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Key Improvement Area</p>
                          <p className="font-medium text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed">{simResult.improvementPriority}</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="trajectory" 
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              {/* Prediction Form Panel */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl">
                <p className="text-slate-400 font-light text-xs sm:text-sm mb-4 leading-relaxed">
                  Deep model predicting realistic occupational milestones over a 5-year timeline, including suggested skills paths.
                </p>
                <button 
                  className="btn bg-gradient-to-r from-primary to-secondary text-white border-none hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-xl w-full h-11 text-xs sm:text-sm font-semibold shadow-lg shadow-primary/10" 
                  onClick={runTrajectory} 
                  disabled={trajLoading}
                >
                  {trajLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" /> Formulating roadmap nodes...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={16} className="mr-2" /> Predict Milestones Roadmap
                    </>
                  )}
                </button>
              </div>

              {/* Trajectory Predict Outcomes */}
              <AnimatePresence>
                {trajResult && (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    {/* Horizontal Roadmap Timeline */}
                    <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch relative">
                      {[
                        { label: '1 Year Milestone', data: trajResult.year1, style: yearColor[0] },
                        { label: '3 Years Milestone', data: trajResult.year3, style: yearColor[1] },
                        { label: '5 Years Milestone', data: trajResult.year5, style: yearColor[2] },
                      ].map((yr, i) => (
                        <div key={i} className="flex flex-col lg:flex-row items-center gap-4 flex-1">
                          <motion.div 
                            variants={itemVariants}
                            className={`glass-panel p-5 sm:p-6 rounded-3xl w-full flex flex-col justify-between h-48 border bg-gradient-to-br ${yr.style.split(' ')[0]} ${yr.style.split(' ')[1]}`}
                          >
                            <div>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${yr.style.split(' ')[2]}`}>
                                {yr.label}
                              </span>
                              <h4 className="font-extrabold text-base text-white mt-2 truncate">
                                {yr.data?.role || '—'}
                              </h4>
                              <p className="text-xs text-slate-400 font-light mt-1">
                                Projected Salary: {yr.data?.salary || '—'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-4">
                              {yr.data?.skills?.map((s, j) => (
                                <span key={j} className="badge bg-white/5 border-white/5 text-[9px] py-2.5 px-2 rounded-lg text-slate-300 font-mono">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                          {i < 2 && (
                            <ArrowRight size={24} className="text-slate-600 hidden lg:block rotate-0 shrink-0 self-center" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Peak & Big Opportunity */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-panel p-6 rounded-3xl border border-primary/10 bg-primary/[0.01] flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0">
                          <Award size={20} />
                        </div>
                        <div>
                          <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">🏆 Projected 10-Year Peak</h4>
                          <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">{trajResult.careerPeak}</p>
                        </div>
                      </div>
                      
                      <div className="glass-panel p-6 rounded-3xl border border-success/10 bg-success/[0.01] flex items-start gap-4">
                        <div className="w-12 h-12 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center text-success shrink-0">
                          <Lightbulb size={20} />
                        </div>
                        <div>
                          <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">🚀 Primary Catalyst Opportunity</h4>
                          <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">{trajResult.biggestOpportunity}</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
