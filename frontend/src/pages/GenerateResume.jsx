import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router";
import toast from "react-hot-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { FaTrash, FaPlusCircle, FaFileDownload, FaFileUpload, FaGithub, FaMagic, FaSave } from "react-icons/fa";
import { BiBook } from "react-icons/bi";
import { motion } from "framer-motion";

import Resume from "../components/Resume";
import PromptInput from "../components/PromptInput";
import AtsCheckerModal from "../components/AtsCheckerModal";
import CoverLetterModal from "../components/CoverLetterModal";
import FeedbackWidget from "../components/FeedbackWidget";
import { loadResume, saveResume, isLoggedIn } from "../api/ResumeService";
import useChatStore from "../store/chatStore";

const EMPTY_RESUME = {
  personalInformation: { fullName: "", email: "", phoneNumber: "", location: "", linkedIn: "", gitHub: "", portfolio: "" },
  summary: "",
  skills: [], experience: [], education: [], certifications: [],
  projects: [], languages: [], interests: [],
};

const GenerateResume = () => {
  const location       = useLocation();
  const fileInputRef   = useRef(null);

  const { setUpdateResumeCallback, setActiveResume, pendingResume, setPendingResume } = useChatStore();

  const [data, setData]                     = useState(EMPTY_RESUME);
  const [showFormUI, setShowFormUI]         = useState(false);
  const [showResumeUI, setShowResumeUI]     = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [saveTitle, setSaveTitle]           = useState("");
  const [savingResume, setSavingResume]     = useState(false);

  const { register, handleSubmit, control, setValue, reset } = useForm({ defaultValues: EMPTY_RESUME });

  const experienceFields    = useFieldArray({ control, name: "experience" });
  const educationFields     = useFieldArray({ control, name: "education" });
  const certificationsFields = useFieldArray({ control, name: "certifications" });
  const projectsFields      = useFieldArray({ control, name: "projects" });
  const languagesFields     = useFieldArray({ control, name: "languages" });
  const interestsFields     = useFieldArray({ control, name: "interests" });
  const skillsFields        = useFieldArray({ control, name: "skills" });

  const [githubUsername, setGithubUsername] = useState("");

  // Load resume from dashboard if resumeId is in location state
  useEffect(() => {
    const resumeId = location.state?.resumeId;
    if (resumeId) {
      loadResume(resumeId).then(({ data: resumeData }) => {
        reset(resumeData);
        setData(resumeData);
        setShowPromptInput(false);
        setShowFormUI(true);
        toast.success("Resume loaded!");
      }).catch(() => toast.error("Failed to load resume"));
    }
  }, [location.state]);

  // Sync active resume data to chatStore
  useEffect(() => {
    setActiveResume(data);
  }, [data, setActiveResume]);

  useEffect(() => {
    const callback = (newResume) => {
      reset(newResume);
      setData(newResume);
      setShowPromptInput(false);
      setShowFormUI(true);
      toast.success("Applied AI suggestions to your resume!");
    };
    setUpdateResumeCallback(callback);

    // Apply any pending resume suggestions from redirect
    if (pendingResume) {
      callback(pendingResume);
      setPendingResume(null);
    }

    return () => {
      setUpdateResumeCallback(null);
    };
  }, [reset, setUpdateResumeCallback, pendingResume, setPendingResume]);

  // ── Handlers ───────────────────────────────────────────────────
  const onSubmit = (formData) => {
    setData({ ...formData });
    setShowFormUI(false);
    setShowPromptInput(false);
    setShowResumeUI(true);
  };

  const handleExport = () => {
    const link = document.createElement("a");
    link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    link.download = "resume_data.json";
    link.click();
    toast.success("Exported successfully!");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setData(parsed);
        reset(parsed);
        toast.success("Imported successfully!");
      } catch {
        toast.error("Invalid JSON file");
      }
    };
  };

  const handleGithubImport = async () => {
    if (!githubUsername) { toast.error("Enter a GitHub username"); return; }
    try {
      const res = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=5`);
      if (!res.ok) throw new Error("Failed");
      const repos = await res.json();
      setValue("projects", repos.map((r) => ({
        title: r.name, description: r.description || "No description",
        technologiesUsed: r.language || "N/A", githubLink: r.html_url,
      })));
      toast.success(`Imported ${repos.length} repos from GitHub!`);
    } catch {
      toast.error("Failed to fetch GitHub projects");
    }
  };

  const handleSaveResume = async () => {
    if (!isLoggedIn()) { toast.error("Login to save resumes"); return; }
    const title = saveTitle || data.personalInformation?.fullName || "My Resume";
    setSavingResume(true);
    try {
      await saveResume(title, data);
      toast.success(`"${title}" saved to your dashboard!`);
    } catch {
      toast.error("Failed to save resume");
    } finally {
      setSavingResume(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────
  const renderInput = (name, label, type = "text") => (
    <div className="form-control w-full mb-3">
      <label className="label py-1">
        <span className="label-text text-slate-300 font-medium text-xs sm:text-sm">{label}</span>
      </label>
      <input 
        type={type} 
        {...register(name)}
        className="input rounded-xl w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-all duration-300 h-10 px-4 text-sm" 
      />
    </div>
  );

  const renderFieldArray = (fields, label, name, keys) => (
    <div className="form-control w-full mb-6">
      <h3 className="text-lg font-bold mb-3 text-slate-200 border-b border-white/5 pb-1.5 flex items-center justify-between">
        <span>{label}</span>
        <span className="badge bg-white/5 border-white/10 text-slate-400 text-xs py-2.5 px-2 rounded-lg font-mono">
          {fields.fields.length}
        </span>
      </h3>
      {fields.fields.map((field, index) => (
        <div key={field.id} className="p-4 sm:p-5 rounded-2xl mb-4 bg-white/[0.02] border border-white/5 relative group transition-all hover:bg-white/[0.03]">
          {keys.map((key) => (
            <div key={key}>
              {renderInput(
                `${name}.${index}.${key}`, 
                key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => fields.remove(index)}
            className="btn btn-ghost hover:bg-error/10 border border-white/5 hover:border-error/20 hover:text-error btn-xs rounded-xl mt-2 flex items-center gap-1 transition-all"
          >
            <FaTrash size={10} /> Remove {label}
          </button>
        </div>
      ))}
      <button 
        type="button"
        onClick={() => fields.append(keys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}))}
        className="btn btn-outline border-primary/20 hover:border-primary hover:bg-primary/10 text-primary hover:text-white btn-sm rounded-xl mt-1 flex items-center gap-1.5 transition-all w-fit"
      >
        <FaPlusCircle className="text-xs" /> Add {label}
      </button>
    </div>
  );

  // ── Views ──────────────────────────────────────────────────────
  const stagger = { 
    hidden: { opacity: 0 }, 
    show: { opacity: 1, transition: { staggerChildren: 0.05 } } 
  };
  
  const fadeUp = { 
    hidden: { opacity: 0, y: 15 }, 
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } 
  };

  if (showPromptInput) {
    return (
      <motion.div
        className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.35 }}
      >
        <PromptInput onGenerated={(resumeData) => {
          reset(resumeData);
          setData(resumeData);
          setShowPromptInput(false);
          setShowFormUI(true);
        }} />
      </motion.div>
    );
  }

  if (showFormUI) {
    return (
      <motion.div 
        className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8" 
        initial="hidden" 
        animate="show" 
        variants={stagger}
      >
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <span className="text-accent text-xs font-semibold uppercase tracking-wider bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
              Interactive Editor
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-gradient-glow flex items-center gap-2">
              <BiBook className="text-accent" /> Complete Your Profile
            </h1>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleExport} 
              className="btn btn-outline border-info/30 hover:border-info hover:bg-info/10 text-info hover:text-white rounded-xl btn-sm h-10 px-4 transition-all"
            >
              <FaFileDownload className="mr-1.5 text-xs" /> Export JSON
            </button>
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="btn btn-outline border-success/30 hover:border-success hover:bg-success/10 text-success hover:text-white rounded-xl btn-sm h-10 px-4 transition-all"
            >
              <FaFileUpload className="mr-1.5 text-xs" /> Import JSON
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          </div>
        </motion.div>

        <motion.form 
          variants={fadeUp} 
          onSubmit={handleSubmit(onSubmit)}
          className="glass-panel p-6 sm:p-8 rounded-3xl text-slate-200 shadow-2xl space-y-6"
        >
          {/* Personal Info Grid */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-slate-100 border-b border-white/5 pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              {renderInput("personalInformation.fullName", "Full Name")}
              {renderInput("personalInformation.email", "Email", "email")}
              {renderInput("personalInformation.phoneNumber", "Phone Number", "tel")}
              {renderInput("personalInformation.location", "Location")}
              {renderInput("personalInformation.linkedin", "LinkedIn URL", "url")}
              {renderInput("personalInformation.gitHub", "GitHub URL", "url")}
              {renderInput("personalInformation.portfolio", "Portfolio URL", "url")}
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <h3 className="text-lg font-bold mb-2 text-slate-100">Professional Summary</h3>
            <textarea 
              {...register("summary")}
              className="textarea w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none text-sm resize-none transition-all leading-relaxed" 
              rows={4} 
              placeholder="Write a brief professional summary describing your core value proposition..."
            />
          </div>

          {/* Core Skills FieldArray */}
          {renderFieldArray(skillsFields, "Skills", "skills", ["title", "level"])}
          
          {/* Experience FieldArray */}
          {renderFieldArray(experienceFields, "Work Experience", "experience",
            ["jobTitle", "company", "location", "duration", "responsibility"])}
          
          {/* Education FieldArray */}
          {renderFieldArray(educationFields, "Education", "education",
            ["degree", "university", "location", "graduationYear"])}
          
          {/* Certifications FieldArray */}
          {renderFieldArray(certificationsFields, "Certifications", "certifications",
            ["title", "issuingOrganization", "year"])}

          {/* GitHub Repository Import */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-end gap-4">
            <div className="form-control w-full sm:max-w-xs">
              <label className="label py-1">
                <span className="label-text text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <FaGithub className="text-base text-slate-400" /> Auto-import GitHub Projects
                </span>
              </label>
              <input 
                type="text" 
                placeholder="Username" 
                className="input rounded-xl w-full bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-all h-10 px-4 text-sm"
                value={githubUsername} 
                onChange={(e) => setGithubUsername(e.target.value)} 
              />
            </div>
            <button 
              type="button" 
              onClick={handleGithubImport} 
              className="btn bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200 rounded-xl h-10 px-4 text-xs font-semibold w-full sm:w-auto"
            >
              Sync repositories
            </button>
          </div>

          {/* Projects FieldArray */}
          {renderFieldArray(projectsFields, "Projects", "projects",
            ["title", "description", "technologiesUsed", "githubLink"])}

          {/* Languages & Interests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {renderFieldArray(languagesFields, "Languages", "languages", ["name"])}
            </div>
            <div>
              {renderFieldArray(interestsFields, "Interests", "interests", ["name"])}
            </div>
          </div>

          {/* Form Action */}
          <div className="pt-4 border-t border-white/5">
            <button 
              type="submit" 
              className="btn btn-theme-inverse hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl w-full h-12 text-sm font-semibold"
            >
              Preview & Compile Resume
            </button>
          </div>
        </motion.form>
      </motion.div>
    );
  }

  if (showResumeUI) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
      >
        {/* Template Picker Headers */}
        <motion.div
          className="flex justify-center items-center gap-2 mb-8 bg-white/[0.02] border border-white/5 p-2 rounded-2xl shadow-inner max-w-md mx-auto"
          initial={{ opacity: 0, y: -12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }}
        >
          {["modern", "classic", "creative"].map((t) => (
            <button 
              key={t} 
              onClick={() => setSelectedTemplate(t)}
              className={`btn btn-sm flex-1 capitalize rounded-xl h-9 border-none transition-all ${
                selectedTemplate === t 
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/10" 
                  : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </motion.div>

        {/* The Live Rendered Resume component */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/5 mb-8">
          <Resume data={data} templateId={selectedTemplate} />
        </div>

        {/* Action controls bar */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-3xl"
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => { setShowPromptInput(true); setShowFormUI(false); setShowResumeUI(false); }}
              className="btn bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-2xl h-11 px-4 text-xs font-semibold transition-all"
            >
              Start New Build
            </button>
            <button 
              onClick={() => { setShowPromptInput(false); setShowFormUI(true); setShowResumeUI(false); }}
              className="btn btn-outline border-secondary/20 hover:border-secondary hover:bg-secondary/10 text-secondary hover:text-white rounded-2xl h-11 px-5 text-xs font-semibold transition-all"
            >
              Edit Content
            </button>
            <button 
              onClick={() => document.getElementById("ai_modal").showModal()}
              className="btn btn-theme-inverse rounded-2xl h-11 px-5 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <FaMagic /> AI Tools
            </button>
            <button 
              onClick={() => document.getElementById("cl_modal").showModal()}
              className="btn bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-2xl h-11 px-4 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              ✍️ Cover Letter
            </button>
          </div>

          {/* Account Save form */}
          {isLoggedIn() && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Document Title (e.g. Resume v1)" 
                className="input rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-all h-11 px-4 text-xs flex-1 sm:w-48"
                value={saveTitle} 
                onChange={(e) => setSaveTitle(e.target.value)} 
              />
              <button 
                onClick={handleSaveResume} 
                disabled={savingResume} 
                className="btn bg-warning hover:bg-warning/95 text-slate-900 border-none rounded-2xl h-11 px-4 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-warning/10"
              >
                {savingResume ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <FaSave />
                )}
                Save Workspace
              </button>
            </div>
          )}
        </motion.div>

        <AtsCheckerModal resumeData={data} />
        <CoverLetterModal resumeData={data} />
        <div className="mt-8 max-w-sm">
          <FeedbackWidget endpointType="GENERATE" aiResponseSnippet={JSON.stringify(data).slice(0, 500)} compact />
        </div>
      </motion.div>
    );
  }

  return null;
};

export default GenerateResume;
