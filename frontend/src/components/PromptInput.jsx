import { useState } from "react";
import toast from "react-hot-toast";
import { FaBrain, FaPaperPlane, FaTrash } from "react-icons/fa";
import { generateResume, streamResume } from "../api/ResumeService";

const PromptInput = ({ onGenerated }) => {
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);
  const [streaming, setStreaming]      = useState(false);
  const [streamText, setStreamText]   = useState("");

  const handleGenerate = async () => {
    if (!description.trim()) { toast.error("Please enter a description"); return; }
    setLoading(true);
    try {
      const responseData = await generateResume(description);
      toast.success("Resume Generated!", { duration: 3000, position: "top-center" });
      onGenerated(responseData.data);
    } catch {
      toast.error("Error generating resume. Is Ollama running?");
    } finally {
      setLoading(false);
      setDescription("");
    }
  };

  const handleStream = () => {
    if (!description.trim()) { toast.error("Please enter a description"); return; }
    setStreaming(true);
    setStreamText("");

    streamResume(
      description,
      (accumulated) => setStreamText(accumulated),
      (final) => {
        setStreaming(false);
        // Parse the final accumulated SSE response
        const jsonMatch = final.match(/```json\n?([\s\S]*?)```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1].trim());
            onGenerated(parsed);
            toast.success("Resume streamed!", { position: "top-center" });
          } catch {
            toast.error("Streaming complete but response parsing failed");
          }
        } else {
          toast.error("Could not parse streamed response");
        }
        setStreamText("");
        setDescription("");
      },
      (err) => {
        setStreaming(false);
        setStreamText("");
        toast.error("Streaming failed: " + err.message);
      }
    );
  };

  return (
    <div className="bg-base-200 shadow-xl rounded-lg p-10 max-w-2xl w-full text-center animate-fade-in">
      <h1 className="text-4xl font-bold mb-6 flex items-center justify-center gap-2">
        <FaBrain className="text-accent animate-bounce" /> AI Resume Description Input
      </h1>
      <p className="mb-4 text-lg text-base-content/60">
        Describe yourself — your experience, skills, education, projects — and let AI build your resume.
      </p>

      <textarea
        disabled={loading || streaming}
        className="textarea textarea-bordered w-full h-48 mb-4 resize-none bg-base-100 transition focus:ring-2 focus:ring-primary"
        placeholder="E.g. I am a backend developer with 3 years of experience in Java and Spring Boot, built microservices at XYZ Corp, have a B.Tech in CS..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* SSE streaming display */}
      {streaming && streamText && (
        <div className="bg-base-100 rounded-lg p-4 mb-4 text-left text-xs font-mono overflow-y-auto max-h-48 text-base-content/70 whitespace-pre-wrap">
          {streamText}
          <span className="animate-pulse">▌</span>
        </div>
      )}

      <div className="flex justify-center gap-3 flex-wrap">
        <button
          disabled={loading || streaming}
          onClick={handleGenerate}
          className="btn btn-primary flex items-center gap-2"
        >
          {loading ? <span className="loading loading-spinner" /> : <FaPaperPlane />}
          Generate Resume
        </button>

        <button
          disabled={loading || streaming}
          onClick={handleStream}
          className="btn btn-secondary flex items-center gap-2"
        >
          {streaming ? <span className="loading loading-spinner" /> : "⚡"}
          Stream (Live)
        </button>

        <button
          onClick={() => setDescription("")}
          disabled={loading || streaming}
          className="btn btn-ghost flex items-center gap-2"
        >
          <FaTrash /> Clear
        </button>
      </div>
    </div>
  );
};

export default PromptInput;
