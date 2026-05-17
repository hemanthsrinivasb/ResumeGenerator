import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router";
import toast from "react-hot-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { FaTrash, FaPlusCircle, FaFileDownload, FaFileUpload, FaGithub, FaMagic, FaSave } from "react-icons/fa";
import { BiBook } from "react-icons/bi";

import Resume from "../components/Resume";
import PromptInput from "../components/PromptInput";
import AtsCheckerModal from "../components/AtsCheckerModal";
import CoverLetterModal from "../components/CoverLetterModal";
import { loadResume, saveResume, isLoggedIn } from "../api/ResumeService";

const EMPTY_RESUME = {
  personalInformation: { fullName: "", email: "", phoneNumber: "", location: "", linkedIn: "", gitHub: "", portfolio: "" },
  summary: "",
  skills: [], experience: [], education: [], certifications: [],
  projects: [], languages: [], interests: [],
};

const GenerateResume = () => {
  const location       = useLocation();
  const fileInputRef   = useRef(null);

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
    <div className="form-control w-full mb-4">
      <label className="label"><span className="label-text font-medium">{label}</span></label>
      <input type={type} {...register(name)}
        className="input input-bordered rounded-xl w-full bg-base-100 transition focus:ring-2 focus:ring-primary" />
    </div>
  );

  const renderFieldArray = (fields, label, name, keys) => (
    <div className="form-control w-full mb-4">
      <h3 className="text-xl font-semibold mb-2">{label}</h3>
      {fields.fields.map((field, index) => (
        <div key={field.id} className="p-4 rounded-lg mb-4 bg-base-100 shadow border border-base-300">
          {keys.map((key) => <div key={key}>{renderInput(`${name}.${index}.${key}`, key)}</div>)}
          <button type="button" onClick={() => fields.remove(index)}
            className="btn btn-error btn-sm mt-2">
            <FaTrash /> Remove {label}
          </button>
        </div>
      ))}
      <button type="button"
        onClick={() => fields.append(keys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}))}
        className="btn btn-secondary btn-sm mt-2">
        <FaPlusCircle /> Add {label}
      </button>
    </div>
  );

  // ── Views ──────────────────────────────────────────────────────
  if (showPromptInput) {
    return (
      <div className="mt-5 p-10 flex flex-col gap-3 items-center justify-center font-sans">
        <PromptInput onGenerated={(resumeData) => {
          reset(resumeData);
          setData(resumeData);
          setShowPromptInput(false);
          setShowFormUI(true);
        }} />
      </div>
    );
  }

  if (showFormUI) {
    return (
      <div className="w-full p-10 animate-fade-in">
        <h1 className="text-4xl font-bold mb-6 flex items-center justify-center gap-2">
          <BiBook className="text-accent animate-pulse" /> Resume Form
        </h1>

        <div className="flex justify-end gap-2 mb-4 flex-wrap">
          <button onClick={handleExport} className="btn btn-sm btn-outline btn-info gap-1">
            <FaFileDownload /> Export JSON
          </button>
          <button onClick={() => fileInputRef.current.click()} className="btn btn-sm btn-outline btn-success gap-1">
            <FaFileUpload /> Import JSON
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-6 bg-base-200 rounded-lg text-base-content shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("personalInformation.fullName", "Full Name")}
            {renderInput("personalInformation.email", "Email", "email")}
            {renderInput("personalInformation.phoneNumber", "Phone Number", "tel")}
            {renderInput("personalInformation.location", "Location")}
            {renderInput("personalInformation.linkedin", "LinkedIn", "url")}
            {renderInput("personalInformation.gitHub", "GitHub", "url")}
            {renderInput("personalInformation.portfolio", "Portfolio", "url")}
          </div>

          <h3 className="text-xl font-semibold">Summary</h3>
          <textarea {...register("summary")}
            className="textarea textarea-bordered w-full bg-base-100 resize-none focus:ring-2 focus:ring-primary" rows={4} />

          {renderFieldArray(skillsFields, "Skills", "skills", ["title", "level"])}
          {renderFieldArray(experienceFields, "Experience", "experience",
            ["jobTitle", "company", "location", "duration", "responsibility"])}
          {renderFieldArray(educationFields, "Education", "education",
            ["degree", "university", "location", "graduationYear"])}
          {renderFieldArray(certificationsFields, "Certifications", "certifications",
            ["title", "issuingOrganization", "year"])}

          {/* GitHub import */}
          <div className="flex items-end gap-2 p-4 bg-base-100 rounded-lg border border-base-300">
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text font-bold flex items-center gap-2"><FaGithub /> GitHub Projects</span>
              </label>
              <input type="text" placeholder="GitHub Username" className="input input-bordered w-full h-10"
                value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} />
            </div>
            <button type="button" onClick={handleGithubImport} className="btn btn-accent btn-sm h-10">
              Fetch Projects
            </button>
          </div>

          {renderFieldArray(projectsFields, "Projects", "projects",
            ["title", "description", "technologiesUsed", "githubLink"])}

          <div className="flex gap-3 mt-4 p-4 rounded-xl">
            <div className="flex-1">{renderFieldArray(languagesFields, "Languages", "languages", ["name"])}</div>
            <div className="flex-1">{renderFieldArray(interestsFields, "Interests", "interests", ["name"])}</div>
          </div>

          <button type="submit" className="btn btn-primary w-full text-lg">Submit & Preview</button>
        </form>
      </div>
    );
  }

  if (showResumeUI) {
    return (
      <div className="animate-fade-in">
        {/* Template picker */}
        <div className="flex justify-center gap-4 mb-8 bg-base-200 p-4 rounded-xl shadow-inner">
          {["modern", "classic", "creative"].map((t) => (
            <button key={t} onClick={() => setSelectedTemplate(t)}
              className={`btn btn-sm capitalize ${selectedTemplate === t ? "btn-primary" : "btn-ghost"}`}>
              {t}
            </button>
          ))}
        </div>

        <Resume data={data} templateId={selectedTemplate} />

        {/* Action bar */}
        <div className="flex mt-5 justify-center gap-2 flex-wrap">
          <button onClick={() => { setShowPromptInput(true); setShowFormUI(false); setShowResumeUI(false); }}
            className="btn btn-accent">Generate Another</button>
          <button onClick={() => { setShowPromptInput(false); setShowFormUI(true); setShowResumeUI(false); }}
            className="btn btn-success">Edit</button>
          <button onClick={() => document.getElementById("ai_modal").showModal()}
            className="btn btn-secondary"><FaMagic /> AI Tools</button>
          <button onClick={() => document.getElementById("cl_modal").showModal()}
            className="btn btn-info">✍️ Writing Tools</button>

          {/* Save to account */}
          {isLoggedIn() && (
            <div className="flex gap-1">
              <input type="text" placeholder="Resume title..." className="input input-bordered input-sm"
                value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} />
              <button onClick={handleSaveResume} disabled={savingResume} className="btn btn-warning btn-sm gap-1">
                {savingResume ? <span className="loading loading-spinner loading-xs" /> : <FaSave />} Save
              </button>
            </div>
          )}
        </div>

        <AtsCheckerModal resumeData={data} />
        <CoverLetterModal resumeData={data} />
      </div>
    );
  }

  return null;
};

export default GenerateResume;
