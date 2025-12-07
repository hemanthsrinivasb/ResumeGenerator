import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { FaBrain, FaTrash, FaPaperPlane, FaPlusCircle, FaFileDownload, FaFileUpload, FaGithub, FaMagic } from "react-icons/fa";
import { generateResume, analyzeResume, generateCoverLetter } from "../api/ResumeService";
import { BiBook } from "react-icons/bi";
import { useForm, useFieldArray } from "react-hook-form";
import Resume from "../components/Resume";

const GenerateResume = () => {
  const [data, setData] = useState({
    personalInformation: {
      fullName: "Hemanth Srinivas Boddeti",
    },
    summary: "",
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    interests: [],
  });

  const { register, handleSubmit, control, setValue, reset } = useForm({
    defaultValues: data,
  });

  const [showFormUI, setShowFormUI] = useState(false);
  const [showResumeUI, setShowResumeUI] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  const experienceFields = useFieldArray({ control, name: "experience" });
  const educationFields = useFieldArray({ control, name: "education" });
  const certificationsFields = useFieldArray({ control, name: "certifications" });
  const projectsFields = useFieldArray({ control, name: "projects" });
  const languagesFields = useFieldArray({ control, name: "languages" });
  const interestsFields = useFieldArray({ control, name: "interests" });
  const skillsFields = useFieldArray({ control, name: "skills" });

  const onSubmit = (data) => {
    console.log("Form Data:", data);
    setData({ ...data });
    setShowFormUI(false);
    setShowPromptInput(false);
    setShowResumeUI(true);
  };

  const [description, setDescription] = useState(""); const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(data)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "resume_data.json";
    link.click();
    toast.success("Data exported successfully!");
  };

  const handleImport = (e) => {
    const fileReader = new FileReader();
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          setData(parsedData);
          reset(parsedData);
          toast.success("Data imported successfully!");
        } catch (err) {
          toast.error("Invalid JSON file");
        }
      };
    }
  };

  const [githubUsername, setGithubUsername] = useState("");

  const handleGithubImport = async () => {
    if (!githubUsername) {
      toast.error("Please enter a GitHub username");
      return;
    }
    try {
      const res = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=5`);
      if (!res.ok) throw new Error("Failed");
      const repos = await res.json();
      const newProjects = repos.map((repo) => ({
        title: repo.name,
        description: repo.description || "No description",
        technologiesUsed: repo.language || "N/A",
        githubLink: repo.html_url,
      }));
      setValue("projects", newProjects);
      toast.success(`Imported ${repos.length} GitHub Projects!`);
    } catch (e) {
      toast.error("Failed to fetch GitHub projects");
    }
  };



  const [jobDescription, setJobDescription] = useState("");
  const [atsResult, setAtsResult] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [activeTab, setActiveTab] = useState("ats");

  const handleATSCheck = async () => {
    if (!jobDescription) {
      toast.error("Please enter a Job Description");
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeResume(data, jobDescription);
      setAtsResult(res.data);
    } catch (e) {
      toast.error("ATS Check Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCoverLetter = async () => {
    if (!jobDescription) {
      toast.error("Please enter a Job Description");
      return;
    }
    setLoading(true);
    try {
      const res = await generateCoverLetter(data, jobDescription);
      setCoverLetter(res.data?.coverLetter || "Error generating letter");
    } catch (e) {
      toast.error("Cover Letter Generation Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    console.log(description);
    try {
      setLoading(true);
      const responseData = await generateResume(description);
      console.log(responseData);
      reset(responseData.data);

      toast.success("Resume Generated Successfully!", {
        duration: 3000,
        position: "top-center",
      });

      setShowFormUI(true);
      setShowPromptInput(false);
      setShowResumeUI(false);
    } catch (error) {
      console.log(error);
      toast.error("Error Generating Resume!");
    } finally {
      setLoading(false);
      setDescription("");
    }
  };

  const handleClear = () => {
    setDescription("");
  };

  const renderInput = (name, label, type = "text") => (
    <div className="form-control w-full mb-4">
      <label className="label">
        <span className="label-text text-base-content font-medium">{label}</span>
      </label>
      <input
        type={type}
        {...register(name)}
        className="input input-bordered rounded-xl w-full bg-base-100 text-base-content transition-all duration-300 focus:ring-2 focus:ring-primary"
      />
    </div>
  );

  const renderFieldArray = (fields, label, name, keys) => {
    return (
      <div className="form-control w-full mb-4">
        <h3 className="text-xl font-semibold mb-2">{label}</h3>
        {fields.fields.map((field, index) => (
          <div key={field.id} className="p-4 rounded-lg mb-4 bg-base-100 shadow transition-all hover:shadow-md border border-base-300">
            {keys.map((key) => (
              <div key={key}>{renderInput(`${name}.${index}.${key}`, key)}</div>
            ))}
            <button
              type="button"
              onClick={() => fields.remove(index)}
              className="btn btn-error btn-sm mt-2 transition hover:scale-105"
            >
              <FaTrash className="w-5 h-5 text-base-content" /> Remove {label}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            fields.append(keys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}))
          }
          className="btn btn-secondary btn-sm mt-2 flex items-center transition hover:scale-105"
        >
          <FaPlusCircle className="w-5 h-5 mr-1 text-base-content" /> Add {label}
        </button>
      </div>
    );
  };

  function showFormFunction() {
    return (
      <div className="w-full p-10 animate-fade-in">
        <h1 className="text-4xl font-bold mb-6 flex items-center justify-center gap-2">
          <BiBook className="text-accent animate-pulse" /> Resume Form
        </h1>

        <div className="flex justify-end gap-2 mb-4">
          <button onClick={handleExport} className="btn btn-sm btn-outline btn-info gap-2">
            <FaFileDownload /> Export JSON
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            className="btn btn-sm btn-outline btn-success gap-2"
          >
            <FaFileUpload /> Import JSON
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-6 bg-base-200 rounded-lg text-base-content shadow-lg"
        >
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
          <textarea
            {...register("summary")}
            className="textarea textarea-bordered w-full bg-base-100 text-base-content resize-none transition focus:ring-2 focus:ring-primary"
            rows={4}
          ></textarea>

          {renderFieldArray(skillsFields, "Skills", "skills", ["title", "level"])}
          {renderFieldArray(experienceFields, "Experience", "experience", [
            "jobTitle",
            "company",
            "location",
            "duration",
            "responsibility",
          ])}
          {renderFieldArray(educationFields, "Education", "education", [
            "degree",
            "university",
            "location",
            "graduationYear",
          ])}
          {renderFieldArray(certificationsFields, "Certifications", "certifications", [
            "title",
            "issuingOrganization",
            "year",
          ])}

          <div className="flex items-end gap-2 mb-2 p-4 bg-base-100 rounded-lg border border-base-300">
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text font-bold flex items-center gap-2"><FaGithub /> Import Projects from GitHub</span>
              </label>
              <input
                type="text"
                placeholder="GitHub Username"
                className="input input-bordered w-full h-10"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
              />
            </div>
            <button type="button" onClick={handleGithubImport} className="btn btn-accent btn-sm h-10">
              Fetch Projects
            </button>
          </div>

          {renderFieldArray(projectsFields, "Projects", "projects", [
            "title",
            "description",
            "technologiesUsed",
            "githubLink",
          ])}

          <div className="flex gap-3 mt-16 p-4 rounded-xl">
            <div className="flex-1">
              {renderFieldArray(languagesFields, "Languages", "languages", ["name"])}
            </div>
            <div className="flex-1">
              {renderFieldArray(interestsFields, "Interests", "interests", ["name"])}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full text-lg transition hover:scale-105">
            Submit
          </button>
        </form>
      </div>
    );
  }

  function ShowInputField() {
    return (
      <div className="bg-base-200 shadow-xl rounded-lg p-10 max-w-2xl w-full text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-6 flex items-center justify-center gap-2">
          <FaBrain className="text-accent animate-bounce" /> AI Resume Description Input
        </h1>
        <p className="mb-4 text-lg text-gray-600">
          Enter a detailed description about yourself to generate your professional resume.
        </p>
        <textarea
          disabled={loading}
          className="textarea textarea-bordered w-full h-48 mb-6 resize-none bg-base-100 transition focus:ring-2 focus:ring-primary"
          placeholder="Type your description here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <div className="flex justify-center gap-4">
          <button
            disabled={loading}
            onClick={handleGenerate}
            className="btn btn-primary flex items-center gap-2 transition hover:scale-105"
          >
            {loading && <span className="loading loading-spinner"></span>}
            <FaPaperPlane /> Generate Resume
          </button>
          <button
            onClick={handleClear}
            className="btn btn-secondary flex items-center gap-2 transition hover:scale-105"
          >
            <FaTrash /> Clear
          </button>
        </div>
      </div>
    );
  }

  function showResume() {
    return (
      <div className="animate-fade-in">
        <div className="flex justify-center gap-4 mb-8 bg-base-200 p-4 rounded-xl shadow-inner">
          <button
            onClick={() => setSelectedTemplate('modern')}
            className={`btn btn-sm ${selectedTemplate === 'modern' ? 'btn-primary' : 'btn-ghost'}`}>
            Modern
          </button>
          <button
            onClick={() => setSelectedTemplate('classic')}
            className={`btn btn-sm ${selectedTemplate === 'classic' ? 'btn-primary' : 'btn-ghost'}`}>
            Classic
          </button>
          <button
            onClick={() => setSelectedTemplate('creative')}
            className={`btn btn-sm ${selectedTemplate === 'creative' ? 'btn-primary' : 'btn-ghost'}`}>
            Creative
          </button>
        </div>
        <Resume data={data} templateId={selectedTemplate} />
        <div className="flex mt-5 justify-center gap-2 flex-wrap">
          <div
            onClick={() => {
              setShowPromptInput(true);
              setShowFormUI(false);
              setShowResumeUI(false);
            }}
            className="btn btn-accent transition hover:scale-105"
          >
            Generate Another
          </div>
          <div
            onClick={() => {
              setShowPromptInput(false);
              setShowFormUI(true);
              setShowResumeUI(false);
            }}
            className="btn btn-success transition hover:scale-105"
          >
            Edit
          </div>
          <button
            onClick={() => document.getElementById("ai_modal").showModal()}
            className="btn btn-secondary transition hover:scale-105"
          >
            <FaMagic /> AI Tools (ATS & Cover Letter)
          </button>
        </div>

        {/* AI Tools Modal */}
        <dialog id="ai_modal" className="modal">
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FaBrain className="text-primary" /> AI Career Tools
            </h3>

            <div className="flex gap-4 my-4">
              <button
                className={`btn ${activeTab === "ats" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveTab("ats")}
              >
                ATS Checker
              </button>
              <button
                className={`btn ${activeTab === "cl" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveTab("cl")}
              >
                Cover Letter
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Job Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-64"
                  placeholder="Paste the Job Description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="bg-base-200 p-4 rounded-lg overflow-y-auto h-64">
                {activeTab === "ats" && (
                  <div className="space-y-4">
                    {!atsResult && <div className="text-center text-gray-500 mt-10">Run ATS Check to see results</div>}
                    {atsResult && (
                      <>
                        <div className="text-center">
                          <div
                            className={`radial-progress ${atsResult.score > 70 ? "text-success" : "text-warning"}`}
                            style={{ "--value": atsResult.score }}
                            role="progressbar"
                          >
                            {atsResult.score}%
                          </div>
                          <div className="text-sm font-bold mt-2">Match Score</div>
                        </div>
                        <div>
                          <h4 className="font-bold text-error">Missing Keywords</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {atsResult.missingKeywords?.map((kw, i) => (
                              <span key={i} className="badge badge-error badge-outline">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-info">Feedback</h4>
                          <ul className="list-disc list-inside text-sm">
                            {atsResult.feedback?.map((fb, i) => (
                              <li key={i}>{fb}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                    <button className="btn btn-primary w-full mt-4" onClick={handleATSCheck} disabled={loading}>
                      {loading ? <span className="loading loading-spinner"></span> : "Analyze Resume"}
                    </button>
                  </div>
                )}

                {activeTab === "cl" && (
                  <div className="space-y-4">
                    {!coverLetter && <div className="text-center text-gray-500 mt-10">Generate a Cover Letter</div>}
                    {coverLetter && (
                      <div className="whitespace-pre-wrap text-sm font-serif p-4 bg-white text-black rounded shadow">
                        {coverLetter}
                      </div>
                    )}
                    <button className="btn btn-primary w-full mt-4" onClick={handleCoverLetter} disabled={loading}>
                      {loading ? <span className="loading loading-spinner"></span> : "Generate Cover Letter"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Close</button>
              </form>
            </div>
          </div>
        </dialog>
      </div>
    );
  }

  return (
    <div className="mt-5 p-10 flex flex-col gap-3 items-center justify-center font-sans transition-all">
      {showFormUI && showFormFunction()}
      {showPromptInput && ShowInputField()}
      {showResumeUI && showResume()}
    </div>
  );
};

export default GenerateResume;
