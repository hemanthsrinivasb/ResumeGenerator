import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Square, Trophy, ChevronRight, RotateCcw, BookOpen } from "lucide-react";
import { axiosInstance } from "../api/ResumeService";
import toast from "react-hot-toast";

const INTERVIEW_TYPES = [
  { value: "TECHNICAL",     label: "Technical",      desc: "Coding, system design, CS fundamentals",        emoji: "💻" },
  { value: "BEHAVIORAL",    label: "Behavioral",      desc: "STAR-format, leadership, teamwork questions",   emoji: "🤝" },
  { value: "SYSTEM_DESIGN", label: "System Design",   desc: "Architecture, scalability, trade-offs",         emoji: "🏗️" },
  { value: "MIXED",         label: "Mixed",           desc: "Combination of all types — most realistic",     emoji: "🎯" },
];

const SCORE_COLORS = { high: "text-success", mid: "text-warning", low: "text-error" };
const scoreColor  = (s) => s >= 7 ? "success" : s >= 4 ? "warning" : "error";
const bandLabel   = (s) => s >= 8 ? "Senior" : s >= 6 ? "Mid-Level" : s >= 4 ? "Junior" : "Entry-Level";
const bandColor   = (s) => s >= 8 ? "badge-success" : s >= 6 ? "badge-warning" : s >= 4 ? "badge-info" : "badge-error";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Interview() {
  const [view,           setView]     = useState("setup");   // setup | interview | results
  const [jobTitle,       setJobTitle] = useState("");
  const [interviewType,  setType]     = useState("MIXED");
  const [session,        setSession]  = useState(null);
  const [currentQ,       setCurrentQ] = useState(null);
  const [answer,         setAnswer]   = useState("");
  const [evaluation,     setEval]     = useState(null);
  const [showEval,       setShowEval] = useState(false);
  const [results,        setResults]  = useState(null);
  const [loading,        setLoading]  = useState(false);
  const [listening,      setListening]= useState(false);
  const [pastSessions,   setPastSessions] = useState([]);
  const recognitionRef = useRef(null);
  const answerRef      = useRef(null);

  useEffect(() => {
    axiosInstance.get("/api/v1/interview/sessions")
      .then(r => setPastSessions(r.data))
      .catch(() => {});
  }, []);

  // ── Voice input (Web Speech API) ───────────────────────────────────
  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous        = true;
    rec.interimResults    = true;
    rec.lang              = "en-US";
    rec.onresult          = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setAnswer(transcript);
    };
    rec.onerror           = () => { setListening(false); toast.error("Voice input error."); };
    rec.onend             = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  // ── TTS — read question aloud ──────────────────────────────────────
  const readAloud = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate   = 0.95;
    utter.pitch  = 1;
    window.speechSynthesis.speak(utter);
  };

  // ── Start session ──────────────────────────────────────────────────
  const startInterview = async () => {
    if (!jobTitle.trim()) { toast.error("Please enter a job title."); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/v1/interview/sessions", { jobTitle: jobTitle.trim(), interviewType });
      setSession(res.data);
      setCurrentQ(res.data.question);
      setAnswer("");
      setEval(null);
      setShowEval(false);
      setView("interview");
      readAloud(res.data.question.text);
    } catch (e) {
      toast.error("Could not start interview. Is the AI backend running?");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit answer ──────────────────────────────────────────────────
  const submitAnswer = async () => {
    if (!answer.trim()) { toast.error("Please provide an answer."); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/api/v1/interview/sessions/${session.sessionId}/answer`, { answer });
      setAnswer("");
      setEval(res.data.evaluation);
      setShowEval(true);

      if (res.data.sessionComplete) {
        setResults(res.data);
        setView("results");
      } else {
        setSession(prev => ({ ...prev, questionsAnswered: res.data.questionsAnswered }));
        // Next question revealed after user clicks "Next"
        recognitionRef.current?.stop();
        setListening(false);
        setCurrentQ({ _next: res.data.nextQuestion, ...res.data.nextQuestion });
      }
    } catch (e) {
      toast.error("Failed to submit answer.");
    } finally {
      setLoading(false);
    }
  };

  const proceedToNext = () => {
    setShowEval(false);
    setEval(null);
    readAloud(currentQ.text);
    answerRef.current?.focus();
  };

  const endEarly = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/api/v1/interview/sessions/${session.sessionId}/end`);
      setResults(res.data);
      setView("results");
    } catch {
      toast.error("Failed to end session.");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // VIEW: SETUP
  // ═══════════════════════════════════════════════════════════════════
  if (view === "setup") return (
    <motion.div className="max-w-3xl mx-auto px-4 py-10" variants={fadeUp} initial="hidden" animate="show">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <span className="text-4xl">🎤</span> AI Mock Interviewer
      </h1>
      <p className="text-base-content/50 mb-8">Practice with an AI interviewer that evaluates your answers in real-time.</p>

      {/* Job Title */}
      <div className="card bg-base-100 shadow-md mb-5">
        <div className="card-body p-5">
          <label className="label pb-1"><span className="label-text font-semibold">Target Role</span></label>
          <input
            className="input input-bordered w-full"
            placeholder="e.g. Senior Software Engineer, Data Scientist, Product Manager…"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startInterview()}
          />
        </div>
      </div>

      {/* Interview Type */}
      <div className="card bg-base-100 shadow-md mb-8">
        <div className="card-body p-5">
          <label className="label pb-1"><span className="label-text font-semibold">Interview Type</span></label>
          <div className="grid grid-cols-2 gap-3">
            {INTERVIEW_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all
                  ${interviewType === t.value ? "border-primary bg-primary/5" : "border-base-300 hover:border-primary/50"}`}
              >
                <span className="text-2xl mb-1">{t.emoji}</span>
                <span className="font-semibold text-sm">{t.label}</span>
                <span className="text-xs text-base-content/50">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary btn-lg w-full"
        onClick={startInterview}
        disabled={loading}
      >
        {loading ? <><span className="loading loading-spinner loading-sm" /> Preparing Interview…</> : "Start Interview →"}
      </button>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="mt-10">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen size={16} /> Past Sessions</h3>
          <div className="space-y-2">
            {pastSessions.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-base-100 rounded-xl shadow-sm">
                <div>
                  <p className="font-medium text-sm">{s.jobTitle}</p>
                  <p className="text-xs text-base-content/40">{s.interviewType} · {new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
                {s.status === "COMPLETED" && (
                  <span className={`badge ${bandColor(s.overallScore)}`}>
                    {s.overallScore}/10
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // VIEW: INTERVIEW
  // ═══════════════════════════════════════════════════════════════════
  if (view === "interview") return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-base-content/50 font-medium">{session?.jobTitle} · {session?.interviewType}</p>
          <div className="flex items-center gap-2 mt-1">
            <progress
              className="progress progress-primary w-32 h-2"
              value={session?.questionsAnswered || 0}
              max={session?.totalQuestions || 7}
            />
            <span className="text-xs text-base-content/50">
              {session?.questionsAnswered || 0} / {session?.totalQuestions || 7}
            </span>
          </div>
        </div>
        <button onClick={endEarly} disabled={loading} className="btn btn-ghost btn-sm gap-1 text-error">
          <Square size={14} /> End
        </button>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        {!showEval && currentQ && (
          <motion.div
            key={currentQ.sequenceNumber || currentQ.id}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="card bg-base-100 shadow-lg mb-5"
          >
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="badge badge-ghost text-xs">{currentQ.category || "Question"}</span>
                <button onClick={() => readAloud(currentQ.text)} className="btn btn-ghost btn-xs gap-1">
                  🔊 Read
                </button>
              </div>
              <p className="text-lg font-medium leading-relaxed">{currentQ.text}</p>
            </div>
          </motion.div>
        )}

        {/* Evaluation Card */}
        {showEval && evaluation && (
          <motion.div
            key="eval"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className={`card shadow-lg mb-5 border-2 border-${scoreColor(evaluation.score)}`}
          >
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Evaluation</h3>
                <span className={`text-2xl font-bold text-${scoreColor(evaluation.score)}`}>
                  {evaluation.score}/10
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm text-base-content/80 leading-relaxed">
                {evaluation.feedback}
              </div>
              <button
                onClick={proceedToNext}
                className="btn btn-primary btn-sm mt-4 gap-1 self-end"
              >
                Next Question <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer area */}
      {!showEval && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative">
            <textarea
              ref={answerRef}
              className={`textarea textarea-bordered w-full h-36 text-sm resize-none pr-12 ${listening ? "border-error" : ""}`}
              placeholder="Type your answer here, or use the microphone for voice input…"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
            <button
              onClick={toggleVoice}
              className={`absolute bottom-3 right-3 btn btn-circle btn-sm ${listening ? "btn-error animate-pulse" : "btn-ghost"}`}
              title={listening ? "Stop recording" : "Start voice input"}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>
          <button
            className="btn btn-primary w-full mt-3 gap-2"
            onClick={submitAnswer}
            disabled={loading || !answer.trim()}
          >
            {loading ? <><span className="loading loading-spinner loading-sm" /> Evaluating…</> : <><Send size={16} /> Submit Answer</>}
          </button>
        </motion.div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // VIEW: RESULTS
  // ═══════════════════════════════════════════════════════════════════
  if (view === "results") return (
    <motion.div className="max-w-2xl mx-auto px-4 py-8" variants={fadeUp} initial="hidden" animate="show">
      {/* Score hero */}
      <div className="card bg-gradient-to-br from-primary to-secondary text-white shadow-xl mb-6">
        <div className="card-body items-center text-center py-8">
          <Trophy size={40} className="mb-2 opacity-90" />
          <h2 className="text-4xl font-bold">{results?.overallScore}/10</h2>
          <p className="text-xl opacity-90">{bandLabel(results?.overallScore || 0)} Level</p>
          <p className="text-sm opacity-70 mt-1">{results?.questionsAnswered} questions answered</p>
        </div>
      </div>

      {/* Feedback */}
      {results?.feedback && (
        <div className="card bg-base-100 shadow-md mb-5">
          <div className="card-body p-5">
            <h3 className="font-bold mb-2">Overall Feedback</h3>
            <p className="text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">{results.feedback}</p>
          </div>
        </div>
      )}

      {/* Per-question breakdown */}
      {results?.questions?.length > 0 && (
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body p-5">
            <h3 className="font-bold mb-3">Question Breakdown</h3>
            <div className="space-y-3">
              {results.questions.map((q, i) => (
                <div key={i} className="border border-base-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs badge badge-ghost">{q.category}</span>
                    <span className={`font-bold text-sm text-${scoreColor(q.score)}`}>{q.score}/10</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{q.question}</p>
                  {q.evaluation && (
                    <p className="text-xs text-base-content/60 whitespace-pre-wrap leading-relaxed">{q.evaluation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => { setView("setup"); setResults(null); }} className="btn btn-primary flex-1 gap-2">
          <RotateCcw size={16} /> New Interview
        </button>
      </div>
    </motion.div>
  );
}
