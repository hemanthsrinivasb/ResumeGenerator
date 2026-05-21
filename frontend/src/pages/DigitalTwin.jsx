import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Loader2, TrendingUp, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getToken } from '../api/ResumeService';

const api = () => axios.create({
  baseURL: '/api/v1',
  headers: { Authorization: `Bearer ${getToken()}` },
});

const GaugeChart = ({ value, color, label }) => {
  const data = [{ name: label, value, fill: color }];
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={180} height={180}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
          startAngle={225} endAngle={-45} data={data}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background dataKey="value" angleAxisId={0} cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="text-3xl font-bold -mt-14" style={{ color }}>{value}%</p>
      <p className="text-sm text-base-content/60 mt-10">{label}</p>
    </div>
  );
};

const decisionColor = (d) => ({
  STRONG_YES: 'badge-success', YES: 'badge-success',
  MAYBE: 'badge-warning', NO: 'badge-error',
})[d] || 'badge-neutral';

const yearColor = ['text-blue-500', 'text-purple-500', 'text-orange-500'];

export default function DigitalTwin() {
  const [resumeJson, setResumeJson]   = useState('');
  const [targetRole, setTargetRole]   = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [simLoading, setSimLoading]   = useState(false);
  const [trajLoading, setTrajLoading] = useState(false);
  const [simResult, setSimResult]     = useState(null);
  const [trajResult, setTrajResult]   = useState(null);
  const [activeTab, setActiveTab]     = useState('simulate');

  const runSimulation = async () => {
    if (!targetRole.trim()) { toast.error('Enter a target role'); return; }
    setSimLoading(true);
    setSimResult(null);
    try {
      const { data } = await api().post('/career-twin/simulate', { resumeJson, targetRole, targetCompany });
      setSimResult(data);
      toast.success('Hiring simulation complete!');
    } catch { toast.error('Simulation failed. Check your AI server.'); }
    finally { setSimLoading(false); }
  };

  const runTrajectory = async () => {
    setTrajLoading(true);
    setTrajResult(null);
    try {
      const { data } = await api().post('/career-twin/trajectory', { resumeJson });
      setTrajResult(data);
      toast.success('Career trajectory predicted!');
    } catch { toast.error('Trajectory prediction failed.'); }
    finally { setTrajLoading(false); }
  };

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <User className="text-primary" size={36} />
            <h1 className="text-4xl font-bold">AI Digital Twin</h1>
          </div>
          <p className="text-base-content/60 text-lg">AI simulates a hiring manager reviewing your profile and predicts your career trajectory.</p>
        </motion.div>

        {/* Resume Input */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="font-bold text-base mb-2">Your Resume JSON <span className="text-base-content/40 font-normal text-sm">(optional — paste from Dashboard → Export)</span></h2>
            <textarea className="textarea textarea-bordered w-full text-xs h-20 resize-none font-mono"
              placeholder='{"name":"...","skills":["..."],...}'
              value={resumeJson} onChange={e => setResumeJson(e.target.value)} />
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow p-1 rounded-2xl w-fit mx-auto">
          <button className={`tab ${activeTab === 'simulate' ? 'tab-active' : ''}`} onClick={() => setActiveTab('simulate')}>
            🎭 Hiring Simulation
          </button>
          <button className={`tab ${activeTab === 'trajectory' ? 'tab-active' : ''}`} onClick={() => setActiveTab('trajectory')}>
            📈 Career Trajectory
          </button>
        </div>

        {/* SIMULATION TAB */}
        <AnimatePresence mode="wait">
          {activeTab === 'simulate' && (
            <motion.div key="simulate" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="space-y-5">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label"><span className="label-text font-semibold">Target Role *</span></label>
                      <input className="input input-bordered w-full" placeholder="e.g. Senior Backend Engineer"
                        value={targetRole} onChange={e => setTargetRole(e.target.value)} />
                    </div>
                    <div>
                      <label className="label"><span className="label-text font-semibold">Target Company</span></label>
                      <input className="input input-bordered w-full" placeholder="e.g. Google, Stripe, Meta"
                        value={targetCompany} onChange={e => setTargetCompany(e.target.value)} />
                    </div>
                  </div>
                  <button className="btn btn-primary w-full gap-2" onClick={runSimulation} disabled={simLoading}>
                    {simLoading ? <Loader2 size={18} className="animate-spin" /> : '🎭'}
                    {simLoading ? 'Simulating Hiring Decision…' : 'Run Hiring Simulation'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {simResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Gauges */}
                    <div className="card bg-base-100 shadow-md">
                      <div className="card-body">
                        <h3 className="font-bold text-center mb-2">Hiring Scores</h3>
                        <div className="flex flex-wrap justify-center gap-8">
                          <GaugeChart value={simResult.shortlistProbability} color="#6366f1" label="Shortlist Probability" />
                          <GaugeChart value={simResult.marketReadiness}      color="#22c55e" label="Market Readiness" />
                        </div>
                        <div className="flex items-center gap-3 justify-center mt-2">
                          <span className={`badge badge-lg ${decisionColor(simResult.hiringDecision)}`}>
                            {simResult.hiringDecision}
                          </span>
                          <span className="text-sm text-base-content/60">{simResult.decisionReason}</span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Gaps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card bg-base-100 shadow-sm border border-success/30">
                        <div className="card-body py-4">
                          <h4 className="font-bold text-success mb-3">✅ Top Strengths</h4>
                          <ul className="space-y-2">
                            {simResult.strengths?.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle size={16} className="text-success shrink-0 mt-0.5" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="card bg-base-100 shadow-sm border border-error/30">
                        <div className="card-body py-4">
                          <h4 className="font-bold text-error mb-3">❌ Critical Gaps</h4>
                          <ul className="space-y-2">
                            {simResult.gaps?.map((g, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <XCircle size={16} className="text-error shrink-0 mt-0.5" />
                                {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Salary + Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card bg-base-100 shadow-sm">
                        <div className="card-body py-4">
                          <p className="text-sm text-base-content/50 mb-1">💰 Salary Range Estimate</p>
                          <p className="font-bold text-lg">{simResult.salaryRange}</p>
                        </div>
                      </div>
                      <div className="card bg-base-100 shadow-sm">
                        <div className="card-body py-4">
                          <p className="text-sm text-base-content/50 mb-1">🎯 #1 Improvement Priority</p>
                          <p className="font-medium text-sm">{simResult.improvementPriority}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TRAJECTORY TAB */}
          {activeTab === 'trajectory' && (
            <motion.div key="trajectory" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-5">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <p className="text-sm text-base-content/60 mb-3">AI predicts your realistic 1-year, 3-year, and 5-year career progression based on your current profile.</p>
                  <button className="btn btn-primary w-full gap-2" onClick={runTrajectory} disabled={trajLoading}>
                    {trajLoading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                    {trajLoading ? 'Predicting…' : 'Predict My Career Trajectory'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {trajResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Timeline */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch">
                      {[
                        { label: '1 Year', data: trajResult.year1, color: yearColor[0] },
                        { label: '3 Years', data: trajResult.year3, color: yearColor[1] },
                        { label: '5 Years', data: trajResult.year5, color: yearColor[2] },
                      ].map((yr, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
                            className="card bg-base-100 shadow-md w-full border border-base-200">
                            <div className="card-body py-4">
                              <span className={`font-bold text-xs uppercase tracking-wide ${yr.color}`}>{yr.label}</span>
                              <p className="font-bold text-base mt-1">{yr.data?.role || '—'}</p>
                              <p className="text-sm text-base-content/60">{yr.data?.salary || '—'}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {yr.data?.skills?.map((s, j) => (
                                  <span key={j} className="badge badge-ghost badge-sm">{s}</span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                          {i < 2 && <ArrowRight size={20} className="text-base-content/30 hidden md:block rotate-0 md:rotate-0 mt-2 self-center" />}
                        </div>
                      ))}
                    </div>

                    {/* Peak + Opportunity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card bg-primary/10 border border-primary/20 shadow-sm">
                        <div className="card-body py-4">
                          <p className="text-xs text-primary font-bold uppercase tracking-wide mb-1">🏆 Career Peak (10 years)</p>
                          <p className="font-semibold text-sm">{trajResult.careerPeak}</p>
                        </div>
                      </div>
                      <div className="card bg-success/10 border border-success/20 shadow-sm">
                        <div className="card-body py-4">
                          <p className="text-xs text-success font-bold uppercase tracking-wide mb-1">🚀 Biggest Opportunity</p>
                          <p className="font-semibold text-sm">{trajResult.biggestOpportunity}</p>
                        </div>
                      </div>
                    </div>
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
