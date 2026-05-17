import { useState } from "react";
import toast from "react-hot-toast";
import { generateCoverLetter, generateLinkedinPost } from "../api/ResumeService";

const CoverLetterModal = ({ resumeData }) => {
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole]         = useState("");
  const [coverLetter, setCoverLetter]       = useState("");
  const [linkedinPost, setLinkedinPost]     = useState(null);
  const [activeTab, setActiveTab]           = useState("cover");
  const [loading, setLoading]               = useState(false);

  const handleCoverLetter = async () => {
    if (!jobDescription.trim()) { toast.error("Please enter a Job Description"); return; }
    setLoading(true);
    try {
      const res = await generateCoverLetter(resumeData, jobDescription);
      setCoverLetter(res.data?.coverLetter || "No cover letter generated");
    } catch {
      toast.error("Cover letter generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedinPost = async () => {
    if (!targetRole.trim()) { toast.error("Please enter a target role"); return; }
    setLoading(true);
    try {
      const res = await generateLinkedinPost(resumeData, targetRole);
      setLinkedinPost(res.data);
    } catch {
      toast.error("LinkedIn post generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <dialog id="cl_modal" className="modal">
      <div className="modal-box w-11/12 max-w-5xl">
        <h3 className="font-bold text-xl mb-4">✍️ Writing Tools</h3>

        <div className="flex gap-2 mb-4">
          <button className={`btn btn-sm ${activeTab === "cover" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("cover")}>
            Cover Letter
          </button>
          <button className={`btn btn-sm ${activeTab === "linkedin" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("linkedin")}>
            LinkedIn Post
          </button>
        </div>

        {activeTab === "cover" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Job Description</span></label>
              <textarea
                className="textarea textarea-bordered h-48 resize-none"
                placeholder="Paste the Job Description..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <button className="btn btn-primary mt-3" onClick={handleCoverLetter} disabled={loading}>
                {loading ? <span className="loading loading-spinner" /> : "Generate Cover Letter"}
              </button>
            </div>
            <div className="bg-base-200 p-4 rounded-lg overflow-y-auto h-64">
              {!coverLetter && <p className="text-center text-base-content/40 mt-10">Your cover letter will appear here</p>}
              {coverLetter && (
                <>
                  <div className="whitespace-pre-wrap text-sm font-serif p-2 bg-white text-black rounded shadow leading-relaxed">
                    {coverLetter}
                  </div>
                  <button className="btn btn-sm btn-outline mt-2 w-full" onClick={() => copyToClipboard(coverLetter)}>
                    📋 Copy to Clipboard
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "linkedin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Target Role</span></label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="e.g. Senior Backend Engineer at Google"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
              <button className="btn btn-secondary mt-3" onClick={handleLinkedinPost} disabled={loading}>
                {loading ? <span className="loading loading-spinner" /> : "Generate LinkedIn Post"}
              </button>
            </div>
            <div className="bg-base-200 p-4 rounded-lg overflow-y-auto h-64">
              {!linkedinPost && <p className="text-center text-base-content/40 mt-10">Your LinkedIn post will appear here</p>}
              {linkedinPost && (
                <div className="space-y-3">
                  <div className="bg-white text-black p-3 rounded shadow text-sm whitespace-pre-wrap leading-relaxed">
                    {linkedinPost.fullPost}
                  </div>
                  <button className="btn btn-sm btn-outline w-full" onClick={() => copyToClipboard(linkedinPost.fullPost)}>
                    📋 Copy Full Post
                  </button>
                  {linkedinPost.icebreaker && (
                    <div>
                      <p className="text-xs font-bold mb-1">💬 Icebreaker (for comments):</p>
                      <div className="bg-white text-black p-2 rounded text-xs">{linkedinPost.icebreaker}</div>
                    </div>
                  )}
                  {linkedinPost.bestTimeToPost && (
                    <p className="text-xs text-base-content/50">⏰ Best time: {linkedinPost.bestTimeToPost}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modal-action">
          <form method="dialog"><button className="btn">Close</button></form>
        </div>
      </div>
    </dialog>
  );
};

export default CoverLetterModal;
