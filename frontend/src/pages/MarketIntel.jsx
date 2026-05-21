import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { TrendingUp, DollarSign, BarChart2, Search, RefreshCw, Zap } from "lucide-react";
import { axiosInstance } from "../api/ResumeService";
import toast from "react-hot-toast";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const TREND_COLOR  = { growing: "#22c55e", stable: "#f59e0b", declining: "#ef4444" };
const CATEGORY_BADGE = { technical: "badge-primary", soft: "badge-ghost", tool: "badge-secondary" };

function SalaryBar({ label, min, max, peak }) {
  const pMin = ((parseInt(min) || 0) / (peak || 1)) * 100;
  const pMax = ((parseInt(max) || 0) / (peak || 1)) * 100;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-base-content/60">{min} – {max}</span>
      </div>
      <div className="relative h-4 bg-base-200 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary/30 rounded-full"
          style={{ left: `${pMin}%`, width: `${pMax - pMin}%` }}
        />
        <div className="absolute left-0 top-0 h-full w-full flex items-center px-2">
          <span className="text-xs text-base-content/50">&nbsp;</span>
        </div>
      </div>
    </div>
  );
}

export default function MarketIntel() {
  const [role,          setRole]         = useState("");
  const [location,      setLocation]     = useState("");
  const [skills,        setSkills]       = useState(null);
  const [salary,        setSalary]       = useState(null);
  const [trends,        setTrends]       = useState(null);
  const [loadingSkills, setLoadingSkills]= useState(false);
  const [loadingSalary, setLoadingSalary]= useState(false);
  const [loadingTrends, setLoadingTrends]= useState(false);

  const fetchSkills = async () => {
    if (!role.trim()) { toast.error("Enter a role first."); return; }
    setLoadingSkills(true);
    try {
      const res = await axiosInstance.get(`/api/v1/market/skills?role=${encodeURIComponent(role)}`);
      setSkills(res.data);
    } catch { toast.error("Failed to fetch skill data."); }
    finally { setLoadingSkills(false); }
  };

  const fetchSalary = async () => {
    if (!role.trim()) { toast.error("Enter a role first."); return; }
    setLoadingSalary(true);
    try {
      const params = new URLSearchParams({ role });
      if (location.trim()) params.set("location", location);
      const res = await axiosInstance.get(`/api/v1/market/salary?${params}`);
      setSalary(res.data);
    } catch { toast.error("Failed to fetch salary data."); }
    finally { setLoadingSalary(false); }
  };

  const fetchTrends = async () => {
    setLoadingTrends(true);
    try {
      const res = await axiosInstance.get("/api/v1/market/trends");
      setTrends(res.data);
    } catch { toast.error("Failed to fetch trends."); }
    finally { setLoadingTrends(false); }
  };

  // Prepare chart data for skills
  const skillChartData = (skills?.skills || []).map(s => ({
    skill: typeof s === "string" ? s : s.skill || "?",
    frequency: typeof s === "object" ? s.frequency || 50 : 50,
    trend: typeof s === "object" ? s.trend || "stable" : "stable",
    category: typeof s === "object" ? s.category || "technical" : "technical",
  })).sort((a, b) => b.frequency - a.frequency).slice(0, 12);

  // Salary peak for bar scaling
  const salaryPeak = salary ? Math.max(
    parseInt(salary.seniorRange?.max) || 0, 300000
  ) : 300000;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <BarChart2 size={24} className="text-primary" /> AI Market Intelligence
        </h1>
        <p className="text-base-content/50 text-sm">
          Real-time skill demand, salary analytics, and hiring trends powered by AI.
        </p>
      </motion.div>

      {/* Search bar */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body p-5">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <label className="label py-1"><span className="label-text text-xs font-semibold">Role / Title</span></label>
              <input className="input input-bordered input-sm w-full" placeholder="e.g. Backend Engineer"
                value={role} onChange={e => setRole(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchSkills()} />
            </div>
            <div className="flex-1 min-w-40">
              <label className="label py-1"><span className="label-text text-xs font-semibold">Location (optional)</span></label>
              <input className="input input-bordered input-sm w-full" placeholder="e.g. Remote, USA"
                value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <button onClick={fetchSkills} disabled={loadingSkills} className="btn btn-primary btn-sm gap-1">
                {loadingSkills ? <span className="loading loading-spinner loading-xs" /> : <Search size={14} />} Skills
              </button>
              <button onClick={fetchSalary} disabled={loadingSalary} className="btn btn-secondary btn-sm gap-1">
                {loadingSalary ? <span className="loading loading-spinner loading-xs" /> : <DollarSign size={14} />} Salary
              </button>
              <button onClick={fetchTrends} disabled={loadingTrends} className="btn btn-accent btn-sm gap-1">
                {loadingTrends ? <span className="loading loading-spinner loading-xs" /> : <TrendingUp size={14} />} Trends
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Demand Chart */}
        <AnimatePresence>
          {skills && (
            <motion.div
              variants={fadeUp} initial="hidden" animate="show"
              className="card bg-base-100 shadow-md lg:col-span-2"
            >
              <div className="card-body p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <BarChart2 size={18} className="text-primary" /> Skill Demand — {skills.role}
                  </h2>
                  <span className="text-xs text-base-content/40">{skills.jobsAnalyzed} jobs analyzed</span>
                </div>

                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={skillChartData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="skill" tick={{ fontSize: 11 }} width={140} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-base-100 border border-base-200 rounded-lg p-2 shadow text-xs">
                            <p className="font-semibold">{d.skill}</p>
                            <p>Demand: {d.frequency}/100</p>
                            <p>Trend: <span style={{ color: TREND_COLOR[d.trend] }}>{d.trend}</span></p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="frequency" radius={[0, 4, 4, 0]}>
                      {skillChartData.map((entry, i) => (
                        <Cell key={i} fill={TREND_COLOR[entry.trend] || "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="flex gap-3 mt-2 flex-wrap">
                  {Object.entries(TREND_COLOR).map(([trend, color]) => (
                    <div key={trend} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                      <span className="capitalize">{trend}</span>
                    </div>
                  ))}
                </div>

                {/* Skill badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {skillChartData.map((s, i) => (
                    <span key={i} className={`badge badge-sm ${CATEGORY_BADGE[s.category] || "badge-ghost"}`}>
                      {s.skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Salary Insights */}
        <AnimatePresence>
          {salary && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="card bg-base-100 shadow-md">
              <div className="card-body p-5">
                <h2 className="font-bold flex items-center gap-2 mb-4">
                  <DollarSign size={18} className="text-secondary" /> Salary Insights
                </h2>
                <p className="text-xs text-base-content/50 mb-3">{salary.role} · {salary.location}</p>

                <SalaryBar label="Junior"  min={salary.juniorRange?.min} max={salary.juniorRange?.max} peak={salaryPeak} />
                <SalaryBar label="Mid"     min={salary.midRange?.min}    max={salary.midRange?.max}    peak={salaryPeak} />
                <SalaryBar label="Senior"  min={salary.seniorRange?.min} max={salary.seniorRange?.max} peak={salaryPeak} />

                <div className="divider my-2" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-base-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-base-content/50">Annual Growth</p>
                    <p className="font-bold text-success">{salary.annualGrowthRate}</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${salary.demandLevel === "High" ? "bg-success/10" : salary.demandLevel === "Low" ? "bg-error/10" : "bg-warning/10"}`}>
                    <p className="text-xs text-base-content/50">Demand</p>
                    <p className="font-bold">{salary.demandLevel}</p>
                  </div>
                </div>

                {salary.marketOutlook && (
                  <p className="text-xs text-base-content/60 mt-3 leading-relaxed italic">"{salary.marketOutlook}"</p>
                )}

                {salary.topPayingCompanies && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-base-content/50 mb-1">Top Paying Companies</p>
                    <div className="flex flex-wrap gap-1">
                      {salary.topPayingCompanies.split(",").map((c, i) => (
                        <span key={i} className="badge badge-ghost badge-sm">{c.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hiring Trends */}
        <AnimatePresence>
          {trends && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="card bg-base-100 shadow-md">
              <div className="card-body p-5">
                <h2 className="font-bold flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-accent" /> Global Hiring Trends
                </h2>
                <p className="text-xs text-base-content/40 mb-3">{trends.jobsAnalyzed} postings analyzed · Remote ratio: {trends.remoteRatio}</p>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-success mb-1">Growing Roles</p>
                    <div className="flex flex-wrap gap-1">
                      {(trends.growingRoles || []).map((r, i) => (
                        <span key={i} className="badge badge-success badge-sm">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-error mb-1">Declining Roles</p>
                    <div className="flex flex-wrap gap-1">
                      {(trends.decliningRoles || []).map((r, i) => (
                        <span key={i} className="badge badge-error badge-sm">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                      <Zap size={12} /> Emerging Technologies
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(trends.emergingTechnologies || []).map((t, i) => (
                        <span key={i} className="badge badge-primary badge-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-base-content/50 mb-1">Hot Industries</p>
                    <div className="flex flex-wrap gap-1">
                      {(trends.hotIndustries || []).map((t, i) => (
                        <span key={i} className="badge badge-ghost badge-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                  {trends.aiImpact && (
                    <div className="bg-primary/5 rounded-xl p-3">
                      <p className="text-xs font-semibold mb-1">AI Impact</p>
                      <p className="text-xs text-base-content/70">{trends.aiImpact}</p>
                    </div>
                  )}
                  {trends.hiringOutlook && (
                    <div className="bg-base-200 rounded-xl p-3">
                      <p className="text-xs font-semibold mb-1">Market Outlook</p>
                      <p className="text-xs text-base-content/70">{trends.hiringOutlook}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {!skills && !salary && !trends && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="text-center py-16 text-base-content/30">
          <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">Enter a role and fetch market data</p>
          <p className="text-sm">Skill demand uses live job postings · Salary estimates are AI-generated</p>
        </motion.div>
      )}
    </div>
  );
}
