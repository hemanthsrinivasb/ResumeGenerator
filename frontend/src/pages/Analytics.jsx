import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { axiosInstance } from "../api/ResumeService";
import { BarChart2, TrendingUp, Layers, Star, RefreshCw } from "lucide-react";

const SKILL_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981",
  "#3b82f6","#ef4444","#14b8a6","#f97316","#84cc16",
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function Analytics() {
  const [evolution,  setEvolution]  = useState([]);
  const [heatmap,    setHeatmap]    = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [evRes, hmRes, sumRes, intRes] = await Promise.all([
        axiosInstance.get("/api/v1/analytics/resume-evolution"),
        axiosInstance.get("/api/v1/analytics/skill-heatmap"),
        axiosInstance.get("/api/v1/analytics/career-summary"),
        axiosInstance.get("/api/v1/analytics/interview-progress"),
      ]);
      setEvolution(evRes.data);
      setHeatmap(hmRes.data);
      setSummary(sumRes.data);
      setInterviews(intRes.data);
    } catch (e) {
      setError("Failed to load analytics. Make sure you're logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <span className="loading loading-spinner loading-lg text-primary" />
      <p className="text-base-content/50 text-sm">Loading your career analytics…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <p className="text-error">{error}</p>
      <button className="btn btn-primary btn-sm" onClick={loadAll}>Retry</button>
    </div>
  );

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-8"
      variants={stagger} initial="hidden" animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart2 className="text-primary" size={32} />
            Career Intelligence
          </h1>
          <p className="text-base-content/50 mt-1">Your resume evolution, skills, and interview performance at a glance.</p>
        </div>
        <button
          onClick={loadAll}
          className="btn btn-ghost btn-sm gap-2 hover:text-primary"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </motion.div>

      {/* KPI Cards */}
      {summary && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Layers size={20} />} label="Resumes Saved"  value={summary.totalResumes}     color="text-primary"  />
          <StatCard icon={<Star size={20} />}   label="Top Skill"      value={summary.topSkill}          color="text-secondary"/>
          <StatCard icon={<TrendingUp size={20}/>} label="Unique Skills" value={summary.uniqueSkillCount} color="text-accent"   />
          <StatCard icon={<BarChart2 size={20}/>}  label="Mock Interviews" value={interviews.length || 0} color="text-success"  />
        </motion.div>
      )}

      {/* Resume Evolution Chart */}
      <motion.div variants={fadeUp} className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Resume Evolution</h2>
          {evolution.length === 0 ? (
            <EmptyState text="Save some resumes to see your evolution timeline." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--b3))" />
                <XAxis
                  dataKey="title"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + "…" : v}
                />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "oklch(var(--b1))", border: "1px solid oklch(var(--b3))", borderRadius: "8px" }}
                  formatter={(value, name) => [value, name === "skillCount" ? "Skills" : "Words"]}
                  labelFormatter={(label) => `Resume: ${label}`}
                />
                <Legend formatter={(v) => v === "skillCount" ? "Skills" : "Word Count"} />
                <Line yAxisId="left"  type="monotone" dataKey="skillCount" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="wordCount"  stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Skill Frequency Bar Chart */}
        <motion.div variants={fadeUp} className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Top Skills</h2>
            {heatmap.length === 0 ? (
              <EmptyState text="Generate and save resumes to see your skill profile." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={heatmap.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--b3))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="skill" type="category" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip
                    contentStyle={{ background: "oklch(var(--b1))", border: "1px solid oklch(var(--b3))", borderRadius: "8px" }}
                    formatter={(v) => [v, "Appearances"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {heatmap.slice(0, 10).map((_, idx) => (
                      <Cell key={idx} fill={SKILL_COLORS[idx % SKILL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Skill Heatmap Grid */}
        <motion.div variants={fadeUp} className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Skill Heatmap</h2>
            {heatmap.length === 0 ? (
              <EmptyState text="No skills found yet." />
            ) : (
              <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
                {heatmap.map(({ skill, count }, idx) => {
                  const maxCount = heatmap[0]?.count || 1;
                  const intensity = Math.round((count / maxCount) * 9) + 1; // 1-10
                  return (
                    <span
                      key={skill}
                      className="badge badge-lg cursor-default select-none"
                      style={{
                        backgroundColor: `${SKILL_COLORS[idx % SKILL_COLORS.length]}${Math.round(intensity * 25).toString(16).padStart(2, "0")}`,
                        color: intensity > 6 ? "#fff" : "inherit",
                        fontSize: `${0.65 + intensity * 0.04}rem`,
                      }}
                      title={`${skill}: appears in ${count} resume(s)`}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Interview Progress */}
      <motion.div variants={fadeUp} className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-lg mb-2">Mock Interview Progress</h2>
          {interviews.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-base-content/40">
              <p className="text-sm">No interview sessions yet.</p>
              <p className="text-xs">Complete a mock interview to track your performance over time.</p>
              <a href="/interview" className="btn btn-primary btn-sm mt-2">Start Mock Interview</a>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={interviews}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--b3))" />
                <XAxis dataKey="jobTitle" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "oklch(var(--b1))", border: "1px solid oklch(var(--b3))", borderRadius: "8px" }} />
                <Bar dataKey="overallScore" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-4">
        <div className={`flex items-center gap-2 ${color} mb-1`}>
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</span>
        </div>
        <p className="text-2xl font-bold truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex items-center justify-center h-36 text-base-content/40 text-sm text-center px-4">
      {text}
    </div>
  );
}
