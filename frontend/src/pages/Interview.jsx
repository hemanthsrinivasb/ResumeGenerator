import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Square, Trophy, ChevronRight, RotateCcw,
  BookOpen, Video, VideoOff, Volume2, VolumeX, Settings, X
} from "lucide-react";
import { axiosInstance } from "../api/ResumeService";
import toast from "react-hot-toast";
import FeedbackWidget from "../components/FeedbackWidget";

const INTERVIEW_TYPES = [
  { value: "TECHNICAL",     label: "Technical",      desc: "Coding, system design, CS fundamentals",        emoji: "💻" },
  { value: "BEHAVIORAL",    label: "Behavioral",      desc: "STAR-format, leadership, teamwork questions",   emoji: "🤝" },
  { value: "SYSTEM_DESIGN", label: "System Design",   desc: "Architecture, scalability, trade-offs",         emoji: "🏗️" },
  { value: "MIXED",         label: "Mixed",           desc: "Combination of all types — most realistic",     emoji: "🎯" },
];

const EMOTION_EMOJI = { happy: "😊", neutral: "😐", sad: "😔", angry: "😤", fear: "😨", surprise: "😲", disgust: "😒" };
const scoreColor  = (s) => s >= 7 ? "success" : s >= 4 ? "warning" : "error";
const bandLabel   = (s) => s >= 8 ? "Senior" : s >= 6 ? "Mid-Level" : s >= 4 ? "Junior" : "Entry-Level";
const bandColor   = (s) => s >= 8 ? "badge-success" : s >= 6 ? "badge-warning" : s >= 4 ? "badge-info" : "badge-error";
const confidenceColor = (c) => c >= 70 ? "progress-success" : c >= 40 ? "progress-warning" : "progress-error";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// Waveform animation bars (shown while recording)
function Waveform({ active }) {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${active ? "bg-error" : "bg-base-300"}`}
          style={{
            height: active ? `${12 + Math.sin(i * 1.2) * 8}px` : "4px",
            animation: active ? `waveBar 0.8s ease-in-out ${i * 0.1}s infinite alternate` : "none",
          }}
        />
      ))}
      <style>{`@keyframes waveBar { from { height: 4px } to { height: 22px } }`}</style>
    </div>
  );
}

// Confidence meter bar
function ConfidenceMeter({ label, value, max = 100, colorClass }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-base-content/60">
        <span>{label}</span><span>{value}</span>
      </div>
      <progress className={`progress ${colorClass} h-2 w-full`} value={value} max={max} />
    </div>
  );
}

export default function Interview() {
  const [view,           setView]         = useState("setup");
  const [jobTitle,       setJobTitle]     = useState("");
  const [interviewType,  setType]         = useState("MIXED");
  const [session,        setSession]      = useState(null);
  const [currentQ,       setCurrentQ]     = useState(null);
  const [answer,         setAnswer]       = useState("");
  const [evaluation,     setEval]         = useState(null);
  const [showEval,       setShowEval]     = useState(false);
  const [results,        setResults]      = useState(null);
  const [loading,        setLoading]      = useState(false);
  const [pastSessions,   setPastSessions] = useState([]);

  // Voice mode (TTS + MediaRecorder)
  const [voiceMode,      setVoiceMode]    = useState(false);
  const [recording,      setRecording]    = useState(false);
  const [audioChunks,    setAudioChunks]  = useState([]);
  const [audioAnalysis,  setAudioAnalysis]= useState(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [ttsEnabled,     setTtsEnabled]   = useState(true);
  const [speechRate,     setSpeechRate]   = useState(1.0);
  const [showSettings,   setShowSettings] = useState(false);

  // Webcam emotion
  const [cameraOn,       setCameraOn]     = useState(false);
  const [emotion,        setEmotion]      = useState(null);
  const [emotionConf,    setEmotionConf]  = useState(0);

  // Web Speech API (text transcript)
  const [listening,      setListening]    = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const recognitionRef   = useRef(null);
  const answerRef        = useRef(null);
  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const streamRef        = useRef(null);
  const emotionTimerRef  = useRef(null);

  useEffect(() => {
    axiosInstance.get("/api/v1/interview/sessions").then(r => setPastSessions(r.data)).catch(() => {});
  }, []);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(emotionTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── TTS ─────────────────────────────────────────────────────────────
  const readAloud = useCallback((text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate  = speechRate;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  }, [ttsEnabled, speechRate]);

  // ── Web Speech API (live transcription to textarea) ─────────────────
  const toggleVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Speech recognition not supported in this browser."); return;
    }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setAnswer(transcript);
    };
    rec.onerror = () => { setListening(false); };
    rec.onend   = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  // ── MediaRecorder (audio capture for multimodal analysis) ───────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await analyzeRecordedAudio(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      // Also start SpeechRecognition for live transcription
      toggleVoiceRecognition();
    } catch {
      toast.error("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    setRecording(false);
    setListening(false);
  };

  const analyzeRecordedAudio = async (blob) => {
    setAnalyzingAudio(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, "answer.webm");
      const res = await axiosInstance.post("/api/v1/multimodal/audio-analyze", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAudioAnalysis(res.data);
      if (res.data.transcript) setAnswer(res.data.transcript);
    } catch {
      // Audio analysis is optional — don't block the interview flow
    } finally {
      setAnalyzingAudio(false);
    }
  };

  // ── Webcam emotion detection ─────────────────────────────────────────
  const toggleCamera = async () => {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(emotionTimerRef.current);
      setCameraOn(false);
      setEmotion(null);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      // Capture frame every 5 seconds for emotion analysis
      emotionTimerRef.current = setInterval(() => captureEmotionFrame(), 5000);
    } catch {
      toast.error("Could not access camera.");
    }
  };

  const captureEmotionFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width  = videoRef.current.videoWidth  || 320;
    canvas.height = videoRef.current.videoHeight || 240;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const fd = new FormData();
        fd.append("file", blob, "frame.jpg");
        const res = await axiosInstance.post("/api/v1/multimodal/video-frame", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.dominant_emotion) {
          setEmotion(res.data.dominant_emotion);
          setEmotionConf(Math.round((res.data.confidence || 0) * 100));
        }
      } catch { /* silent — emotion is non-blocking */ }
    }, "image/jpeg", 0.8);
  };

  // ── Start session ────────────────────────────────────────────────────
  const startInterview = async () => {
    if (!jobTitle.trim()) { toast.error("Please enter a job title."); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/v1/interview/sessions", { jobTitle: jobTitle.trim(), interviewType });
      setSession(res.data);
      setCurrentQ(res.data.question);
      setAnswer(""); setEval(null); setShowEval(false); setAudioAnalysis(null);
      setView("interview");
      readAloud(res.data.question.text);
    } catch {
      toast.error("Could not start interview. Is the AI backend running?");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit answer ────────────────────────────────────────────────────
  const submitAnswer = async () => {
    if (!answer.trim()) { toast.error("Please provide an answer."); return; }
    setLoading(true);
    try {
      const body = { answer };
      if (audioAnalysis) body.audioAnalysis = JSON.stringify(audioAnalysis);

      const res = await axiosInstance.post(`/api/v1/interview/sessions/${session.sessionId}/answer`, body);
      setAnswer(""); setAudioAnalysis(null);
      setEval(res.data.evaluation);
      setShowEval(true);

      if (res.data.sessionComplete) {
        setResults(res.data); setView("results");
      } else {
        setSession(prev => ({ ...prev, questionsAnswered: res.data.questionsAnswered }));
        setCurrentQ(res.data.nextQuestion);
      }
    } catch {
      toast.error("Failed to submit answer.");
    } finally {
      setLoading(false);
    }
  };

  const proceedToNext = () => {
    setShowEval(false); setEval(null);
    readAloud(currentQ.text);
    answerRef.current?.focus();
  };

  const endEarly = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/api/v1/interview/sessions/${session.sessionId}/end`);
      setResults(res.data); setView("results");
    } catch { toast.error("Failed to end session."); }
    finally { setLoading(false); }
  };

  // ════════════════════════════════════════════════════════════════════
  // VIEW: SETUP
  // ════════════════════════════════════════════════════════════════════
  if (view === "setup") return (
    <motion.div className="max-w-3xl mx-auto px-4 py-10" variants={fadeUp} initial="hidden" animate="show">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <span className="text-4xl">🎤</span> AI Mock Interviewer
      </h1>
      <p className="text-base-content/50 mb-8">
        Practice with an AI interviewer — voice-enabled with real-time emotion and confidence analysis.
      </p>

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

      <div className="card bg-base-100 shadow-md mb-5">
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

      {/* Voice mode toggle */}
      <div className="card bg-base-100 shadow-md mb-8">
        <div className="card-body p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Voice Mode</p>
              <p className="text-xs text-base-content/50">AI reads questions aloud + you can answer via microphone</p>
            </div>
            <input type="checkbox" className="toggle toggle-primary" checked={voiceMode} onChange={e => setVoiceMode(e.target.checked)} />
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-lg w-full" onClick={startInterview} disabled={loading}>
        {loading ? <><span className="loading loading-spinner loading-sm" /> Preparing…</> : "Start Interview →"}
      </button>

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
                  <span className={`badge ${bandColor(s.overallScore)}`}>{s.overallScore}/10</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  // ════════════════════════════════════════════════════════════════════
  // VIEW: INTERVIEW
  // ════════════════════════════════════════════════════════════════════
  if (view === "interview") return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Settings drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card bg-base-200 shadow mb-4 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">Voice Settings</p>
              <button onClick={() => setShowSettings(false)} className="btn btn-ghost btn-xs"><X size={14} /></button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs w-20">TTS Speed: {speechRate.toFixed(1)}x</span>
              <input type="range" min="0.5" max="2" step="0.1"
                className="range range-xs range-primary flex-1"
                value={speechRate} onChange={e => setSpeechRate(parseFloat(e.target.value))} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs w-20">AI voice</span>
              <input type="checkbox" className="toggle toggle-sm toggle-primary"
                checked={ttsEnabled} onChange={e => setTtsEnabled(e.target.checked)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-base-content/50 font-medium">{session?.jobTitle} · {session?.interviewType}</p>
          <div className="flex items-center gap-2 mt-1">
            <progress className="progress progress-primary w-32 h-2"
              value={session?.questionsAnswered || 0} max={session?.totalQuestions || 7} />
            <span className="text-xs text-base-content/50">
              {session?.questionsAnswered || 0} / {session?.totalQuestions || 7}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {/* Emotion badge */}
          {emotion && (
            <span className="badge badge-ghost gap-1 text-xs">
              {EMOTION_EMOJI[emotion.toLowerCase()] || "🙂"} {emotion}
            </span>
          )}
          <button onClick={toggleCamera} className={`btn btn-ghost btn-sm ${cameraOn ? "text-primary" : ""}`} title="Toggle webcam emotion">
            {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
          </button>
          <button onClick={() => setTtsEnabled(p => !p)} className={`btn btn-ghost btn-sm ${ttsEnabled ? "text-primary" : ""}`} title="Toggle AI voice">
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button onClick={() => setShowSettings(p => !p)} className="btn btn-ghost btn-sm" title="Settings">
            <Settings size={16} />
          </button>
          <button onClick={endEarly} disabled={loading} className="btn btn-ghost btn-sm text-error gap-1">
            <Square size={14} /> End
          </button>
        </div>
      </div>

      {/* Webcam + hidden canvas */}
      {cameraOn && (
        <div className="mb-4 rounded-xl overflow-hidden border border-base-300 relative">
          <video ref={videoRef} autoPlay muted className="w-full max-h-40 object-cover" />
          {emotion && (
            <div className="absolute top-2 right-2 badge badge-primary gap-1">
              {EMOTION_EMOJI[emotion.toLowerCase()] || "🙂"} {emotion} {emotionConf}%
            </div>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* Question / Evaluation */}
      <AnimatePresence mode="wait">
        {!showEval && currentQ && (
          <motion.div
            key={currentQ.sequenceNumber || currentQ.id}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="card bg-base-100 shadow-lg mb-4"
          >
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-ghost text-xs">{currentQ.category || "Question"}</span>
                <button onClick={() => readAloud(currentQ.text)} className="btn btn-ghost btn-xs gap-1">
                  🔊 Read
                </button>
              </div>
              <p className="text-lg font-medium leading-relaxed">{currentQ.text}</p>
            </div>
          </motion.div>
        )}

        {showEval && evaluation && (
          <motion.div
            key="eval"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className={`card shadow-lg mb-4 border-2 border-${scoreColor(evaluation.score)}`}
          >
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Evaluation</h3>
                <span className={`text-2xl font-bold text-${scoreColor(evaluation.score)}`}>
                  {evaluation.score}/10
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm text-base-content/80 leading-relaxed mb-4">
                {evaluation.feedback}
              </div>

              {/* Voice metrics (shown if audio analysis was used) */}
              {(evaluation.audioConfidence > 0 || evaluation.hesitationCount !== undefined) && (
                <div className="bg-base-200 rounded-xl p-3 mb-3 space-y-2">
                  <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Voice Metrics</p>
                  <ConfidenceMeter label="Voice Confidence" value={evaluation.audioConfidence || 0}
                    colorClass={confidenceColor(evaluation.audioConfidence || 0)} />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-base-content/60">Hesitations</span>
                    <span className={`badge badge-sm ${evaluation.hesitationCount > 5 ? "badge-error" : "badge-success"}`}>
                      {evaluation.hesitationCount ?? 0}
                    </span>
                  </div>
                  {evaluation.dominantEmotion && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-base-content/60">Emotion</span>
                      <span className="badge badge-ghost badge-sm">
                        {EMOTION_EMOJI[evaluation.dominantEmotion?.toLowerCase()] || "🙂"} {evaluation.dominantEmotion}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <FeedbackWidget endpointType="INTERVIEW" aiResponseSnippet={evaluation?.feedback} compact />
                <button onClick={proceedToNext} className="btn btn-primary btn-sm gap-1">
                  Next Question <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer area */}
      {!showEval && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Audio analysis live metrics */}
          {audioAnalysis && (
            <div className="bg-base-200 rounded-xl p-3 mb-3 space-y-2">
              <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Audio Analysis</p>
              <ConfidenceMeter label="Confidence" value={audioAnalysis.confidence_score || 0}
                colorClass={confidenceColor(audioAnalysis.confidence_score || 0)} />
              <div className="flex gap-3 text-xs text-base-content/60 flex-wrap">
                <span>🎙 {audioAnalysis.speech_rate_wpm || 0} wpm</span>
                <span>⏸ {audioAnalysis.hesitation_count || 0} hesitations</span>
                <span>📝 {audioAnalysis.word_count || 0} words</span>
              </div>
            </div>
          )}

          {analyzingAudio && (
            <div className="flex items-center gap-2 text-xs text-base-content/50 mb-2">
              <span className="loading loading-dots loading-xs" /> Analyzing audio…
            </div>
          )}

          <div className="relative">
            <textarea
              ref={answerRef}
              className={`textarea textarea-bordered w-full h-36 text-sm resize-none pr-12
                ${recording ? "border-error" : listening ? "border-warning" : ""}`}
              placeholder={voiceMode ? "Press the mic button to record your answer via voice…" : "Type your answer here…"}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />

            {/* Waveform overlay when recording */}
            {recording && (
              <div className="absolute top-3 right-14 flex items-center gap-2">
                <Waveform active />
                <span className="text-xs text-error font-medium animate-pulse">REC</span>
              </div>
            )}

            {/* Mic button */}
            {voiceMode ? (
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`absolute bottom-3 right-3 btn btn-circle btn-sm ${recording ? "btn-error animate-pulse" : "btn-secondary"}`}
                title={recording ? "Stop recording" : "Record voice answer"}
              >
                {recording ? <Square size={14} /> : <Mic size={14} />}
              </button>
            ) : (
              <button
                onClick={toggleVoiceRecognition}
                className={`absolute bottom-3 right-3 btn btn-circle btn-sm ${listening ? "btn-error animate-pulse" : "btn-ghost"}`}
                title={listening ? "Stop voice input" : "Live voice transcription"}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
          </div>

          <button
            className="btn btn-primary w-full mt-3 gap-2"
            onClick={submitAnswer}
            disabled={loading || !answer.trim() || analyzingAudio}
          >
            {loading ? <><span className="loading loading-spinner loading-sm" /> Evaluating…</>
              : <><Send size={16} /> Submit Answer</>}
          </button>
        </motion.div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // VIEW: RESULTS
  // ════════════════════════════════════════════════════════════════════
  if (view === "results") return (
    <motion.div className="max-w-2xl mx-auto px-4 py-8" variants={fadeUp} initial="hidden" animate="show">
      <div className="card bg-gradient-to-br from-primary to-secondary text-white shadow-xl mb-6">
        <div className="card-body items-center text-center py-8">
          <Trophy size={40} className="mb-2 opacity-90" />
          <h2 className="text-4xl font-bold">{results?.overallScore}/10</h2>
          <p className="text-xl opacity-90">{bandLabel(results?.overallScore || 0)} Level</p>
          <p className="text-sm opacity-70 mt-1">{results?.questionsAnswered} questions answered</p>
        </div>
      </div>

      {results?.feedback && (
        <div className="card bg-base-100 shadow-md mb-5">
          <div className="card-body p-5">
            <h3 className="font-bold mb-2">Overall Feedback</h3>
            <p className="text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">{results.feedback}</p>
          </div>
        </div>
      )}

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
        <button onClick={() => { setView("setup"); setResults(null); setCameraOn(false); streamRef.current?.getTracks().forEach(t => t.stop()); }}
          className="btn btn-primary flex-1 gap-2">
          <RotateCcw size={16} /> New Interview
        </button>
      </div>
    </motion.div>
  );
}
