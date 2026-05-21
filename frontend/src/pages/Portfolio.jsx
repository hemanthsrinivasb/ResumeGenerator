import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Download, Eye, Sparkles, RefreshCw } from "lucide-react";
import { axiosInstance, baseURLL } from "../api/ResumeService";
import toast from "react-hot-toast";

const THEMES = [
  {
    key: "MINIMAL",
    label: "Minimal",
    desc: "Clean white + indigo accent — timeless and professional",
    preview: { bg: "#ffffff", accent: "#6366f1", text: "#111111" },
  },
  {
    key: "TECH",
    label: "Dark Tech",
    desc: "Dark navy + sky blue — favoured by engineers and developers",
    preview: { bg: "#0f172a", accent: "#38bdf8", text: "#e2e8f0" },
  },
  {
    key: "CREATIVE",
    label: "Creative",
    desc: "Soft lavender + fuchsia — bold, artistic, and memorable",
    preview: { bg: "#fdf4ff", accent: "#d946ef", text: "#1e1b4b" },
  },
];

const STEPS = ["Analysing resume…", "Crafting your story…", "Building website…", "Packaging…"];

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12 } } };

export default function Portfolio() {
  const [theme,      setTheme]   = useState("MINIMAL");
  const [resumeId,   setResumeId]= useState("");
  const [loading,    setLoading] = useState(false);
  const [step,       setStep]    = useState(0);
  const [result,     setResult]  = useState(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    setStep(0);

    // Cycle through step labels while waiting
    const interval = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 1800);

    try {
      const body = { theme };
      if (resumeId.trim()) body.resumeId = parseInt(resumeId);
      const res = await axiosInstance.post("/api/v1/portfolio/generate", body);
      setResult(res.data);
    } catch (e) {
      const msg = e?.response?.data?.error || "Generation failed. Save a resume first.";
      toast.error(msg);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const downloadZip = async () => {
    if (!result?.downloadUrl) return;
    try {
      const res = await axiosInstance.get(result.downloadUrl, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement("a");
      a.href = url; a.download = "portfolio.zip"; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed.");
    }
  };

  return (
    <motion.div className="max-w-4xl mx-auto px-4 py-10" variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Globe className="text-primary" size={32} /> Portfolio Generator
        </h1>
        <p className="text-base-content/50 mt-1">
          Generate a complete personal portfolio website from your resume in seconds using AI.
        </p>
      </motion.div>

      {/* Theme Picker */}
      <motion.div variants={fadeUp} className="card bg-base-100 shadow-md mb-5">
        <div className="card-body p-5">
          <h2 className="font-bold mb-4">Choose Your Theme</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`rounded-xl border-2 overflow-hidden text-left transition-all
                  ${theme === t.key ? "border-primary shadow-md" : "border-base-300 hover:border-primary/40"}`}
              >
                {/* Theme preview swatch */}
                <div
                  className="h-20 flex items-center justify-center relative"
                  style={{ background: t.preview.bg, border: `4px solid ${t.preview.accent}22` }}
                >
                  <div style={{ color: t.preview.text, fontWeight: 700, fontSize: "1rem" }}>
                    {t.label}
                  </div>
                  <div
                    className="absolute bottom-2 left-2 right-2 h-1.5 rounded-full"
                    style={{ background: t.preview.accent, opacity: 0.7 }}
                  />
                  {theme === t.key && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ background: t.preview.accent }}
                    >✓</div>
                  )}
                </div>
                <div className="p-3" style={{ background: t.preview.bg }}>
                  <p className="text-xs" style={{ color: t.preview.text, opacity: 0.6 }}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Options */}
      <motion.div variants={fadeUp} className="card bg-base-100 shadow-md mb-6">
        <div className="card-body p-5">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label pb-1"><span className="label-text text-sm">Resume ID (optional — uses latest saved if blank)</span></label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="e.g. 3"
                value={resumeId}
                onChange={e => setResumeId(e.target.value)}
                type="number"
              />
            </div>
            <button
              className="btn btn-primary gap-2"
              onClick={generate}
              disabled={loading}
            >
              {loading
                ? <><span className="loading loading-spinner loading-sm" /> {STEPS[step]}</>
                : <><Sparkles size={16} /> Generate Portfolio</>
              }
            </button>
          </div>
        </div>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Actions */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-bold">Portfolio Ready!</p>
                    <p className="text-xs text-base-content/50 mt-0.5">Theme: {result.theme}</p>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={`${baseURLL}${result.previewUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm gap-2"
                    >
                      <Eye size={14} /> Preview
                    </a>
                    <button onClick={downloadZip} className="btn btn-primary btn-sm gap-2">
                      <Download size={14} /> Download ZIP
                    </button>
                    <button onClick={generate} className="btn btn-ghost btn-sm gap-1">
                      <RefreshCw size={14} /> Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Inline Preview iframe */}
            <div className="card bg-base-100 shadow-md overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-base-200 border-b border-base-300">
                <div className="w-3 h-3 rounded-full bg-error opacity-60" />
                <div className="w-3 h-3 rounded-full bg-warning opacity-60" />
                <div className="w-3 h-3 rounded-full bg-success opacity-60" />
                <span className="text-xs text-base-content/40 ml-2">{result.previewUrl}</span>
              </div>
              <iframe
                src={`${baseURLL}${result.previewUrl}`}
                className="w-full"
                style={{ height: "600px", border: "none" }}
                title="Portfolio Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
