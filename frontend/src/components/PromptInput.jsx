import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaBrain, FaPaperPlane, FaTrash, FaMicrophone, FaStop } from "react-icons/fa";
import { generateResume, streamResume } from "../api/ResumeService";
import ApiErrorModal from "./ApiErrorModal";

const PromptInput = ({ onGenerated }) => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [listening, setListening] = useState(false);
  const [apiError, setApiError] = useState(null);
  const recognitionRef = useRef(null);

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { 
      toast.error("Voice input not supported in this browser. Use Chrome or Edge."); 
      return; 
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript).join(" ");
      setDescription(prev => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + transcript);
    };
    recognition.onerror = () => { 
      setListening(false); 
      toast.error("Voice recognition error"); 
    };
    recognition.onend = () => setListening(false);

    recognition.start();
    setListening(true);
    toast.success("Listening... Speak your career profile details.");
  };

  const handleGenerate = async () => {
    if (!description.trim()) { 
      toast.error("Please enter a description"); 
      return; 
    }
    setLoading(true);
    try {
      const responseData = await generateResume(description);
      if (responseData.error) {
        setApiError(responseData.error);
      } else if (!responseData.data) {
        setApiError("Backend succeeded but returned empty resume content.");
      } else {
        toast.success("Resume Generated Successfully!", { duration: 3000, position: "top-center" });
        onGenerated(responseData.data);
      }
    } catch (err) {
      setApiError(err);
    } finally {
      setLoading(false);
      setDescription("");
    }
  };

  const handleStream = () => {
    if (!description.trim()) { 
      toast.error("Please enter a description"); 
      return; 
    }
    setStreaming(true);
    setStreamText("");

    streamResume(
      description,
      (accumulated) => setStreamText(accumulated),
      (final) => {
        setStreaming(false);
        const jsonMatch = final.match(/```json\n?([\s\S]*?)```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1].trim());
            onGenerated(parsed);
            toast.success("Resume streamed successfully!", { position: "top-center" });
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
        setApiError(err);
      }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel card-glow rounded-3xl p-8 sm:p-10 max-w-2xl w-full text-center relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
      
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
        <FaBrain className={`text-3xl ${loading || streaming ? 'animate-pulse' : ''}`} />
      </div>
      
      <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-gradient-glow">
        AI Resume Composer
      </h2>
      <p className="mb-8 text-slate-400 font-light text-sm sm:text-base max-w-md mx-auto">
        Describe your background, skills, projects, and career aspirations, and let the intelligence engine format the layout.
      </p>

      <div className="relative mb-6">
        <textarea
          disabled={loading || streaming}
          className="textarea w-full h-48 p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none text-sm sm:text-base resize-none transition-all leading-relaxed"
          placeholder="E.g. I am a Senior Backend Developer with 5 years of experience in Node.js and AWS. I led a team of 4 engineers at Acme Corp to deploy serverless microservices, reducing latency by 30%. I hold a BS in CS from MIT..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="button"
          onClick={toggleVoiceInput}
          disabled={loading || streaming}
          title={listening ? "Stop recording" : "Record voice input"}
          className={`absolute bottom-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            listening 
              ? 'bg-error text-white animate-pulse shadow-lg shadow-error/30' 
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
          }`}
        >
          {listening ? <FaStop className="text-xs" /> : <FaMicrophone className="text-sm" />}
        </button>
      </div>

      <AnimatePresence>
        {streaming && streamText && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 text-left text-xs font-mono overflow-y-auto max-h-48 text-slate-300 whitespace-pre-wrap relative"
          >
            <div className="absolute top-2 right-2 text-[9px] text-secondary font-sans uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Streaming System Logs
            </div>
            {streamText}
            <span className="inline-block w-1.5 h-3 bg-secondary animate-pulse ml-0.5" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          disabled={loading || streaming}
          onClick={handleGenerate}
          className="btn btn-theme-inverse hover:scale-103 active:scale-97 transition-all rounded-2xl px-6 h-12 flex-1 sm:flex-initial"
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm mr-2" />
          ) : (
            <FaPaperPlane className="text-xs mr-2" />
          )}
          Generate Document
        </button>

        <button
          disabled={loading || streaming}
          onClick={handleStream}
          className="btn btn-outline border-secondary/30 hover:border-secondary hover:bg-secondary/10 text-secondary hover:text-white rounded-2xl px-6 h-12 flex-1 sm:flex-initial transition-all"
        >
          {streaming ? (
            <span className="loading loading-spinner loading-sm mr-2" />
          ) : (
            <span className="mr-2">⚡</span>
          )}
          Stream Live
        </button>

        <button
          onClick={() => setDescription("")}
          disabled={loading || streaming}
          className="btn btn-ghost hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl px-5 h-12 text-slate-400 hover:text-white"
        >
          <FaTrash className="text-xs mr-2" /> Clear
        </button>
      </div>

      <ApiErrorModal
        isOpen={!!apiError}
        onClose={() => setApiError(null)}
        error={apiError}
      />
    </motion.div>
  );
};

export default PromptInput;
