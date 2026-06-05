import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Loader2, 
  Mic, 
  Camera, 
  CheckCircle2, 
  MessageSquare, 
  AlertTriangle, 
  Square, 
  ShieldCheck, 
  Sparkles,
  Award,
  Video,
  Smile,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getToken, baseURLL } from '../api/ResumeService';

const api = () => axios.create({
  baseURL: `${baseURLL}/api/v1`,
  headers: { Authorization: `Bearer ${getToken()}` },
});

const ScoreBar = ({ label, value, color = '#6366f1' }) => (
  <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-5 space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <span className="text-sm font-bold text-white bg-slate-950/50 px-2.5 py-1 rounded-md border border-white/5" style={{ textShadow: `0 0 12px ${color}30` }}>
        {value}/100
      </span>
    </div>
    <div className="w-full bg-slate-950/60 rounded-full h-2.5 overflow-hidden border border-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 14px ${color}`
        }}
      />
    </div>
  </div>
);

export default function Multimodal() {
  const [activeTab, setActiveTab] = useState('github');

  // GitHub state
  const [githubUsername, setGithubUsername]   = useState('');
  const [githubToken, setGithubToken]         = useState('');
  const [githubLoading, setGithubLoading]     = useState(false);
  const [githubResult, setGithubResult]       = useState(null);

  // Audio state
  const [audioFile, setAudioFile]             = useState(null);
  const [audioLoading, setAudioLoading]       = useState(false);
  const [audioResult, setAudioResult]         = useState(null);
  const [recording, setRecording]             = useState(false);
  const mediaRecorderRef                      = useRef(null);
  const chunksRef                             = useRef([]);

  // Video frame state
  const [videoLoading, setVideoLoading]       = useState(false);
  const [videoResult, setVideoResult]         = useState(null);
  const videoRef                              = useRef(null);
  const canvasRef                             = useRef(null);
  const [cameraStream, setCameraStream]       = useState(null);

  // Communication state
  const [commTranscript, setCommTranscript]   = useState('');
  const [commLoading, setCommLoading]         = useState(false);
  const [commResult, setCommResult]           = useState(null);

  // ── GitHub Analysis ──────────────────────────────────────────────
  const analyzeGitHub = async () => {
    if (!githubUsername.trim()) { toast.error('Enter a GitHub username'); return; }
    setGithubLoading(true); setGithubResult(null);
    try {
      const { data } = await api().post('/multimodal/github-analyze', {
        githubUsername, githubToken,
      });
      setGithubResult(data);
      toast.success('GitHub profile analyzed!');
    } catch { toast.error('Analysis failed. Make sure multimodal-service is running.'); }
    finally { setGithubLoading(false); }
  };

  // ── Audio Recording ──────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioFile(new File([blob], 'recording.webm', { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      toast.success('Recording… click Stop when done');
    } catch { toast.error('Microphone access denied'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const analyzeAudio = async (file) => {
    const f = file || audioFile;
    if (!f) { toast.error('Record or upload an audio file first'); return; }
    setAudioLoading(true); setAudioResult(null);
    const formData = new FormData();
    formData.append('file', f);
    try {
      const { data } = await api().post('/multimodal/audio-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAudioResult(data);
      if (data.transcript) setCommTranscript(data.transcript);
      toast.success('Audio analyzed!');
    } catch { toast.error('Audio analysis failed.'); }
    finally { setAudioLoading(false); }
  };

  // ── Camera Snapshot ──────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { toast.error('Camera access denied'); }
  };

  const captureAndAnalyze = async () => {
    if (!cameraStream || !videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
      setVideoLoading(true); setVideoResult(null);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const { data } = await api().post('/multimodal/video-frame', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setVideoResult(data);
        toast.success('Emotion analysis complete!');
      } catch { toast.error('Video analysis failed.'); }
      finally { setVideoLoading(false); }
    }, 'image/jpeg');
  };

  // ── Communication Analysis ───────────────────────────────────────
  const analyzeCommunication = async () => {
    if (!commTranscript.trim()) { toast.error('Enter a transcript to analyze'); return; }
    setCommLoading(true); setCommResult(null);
    try {
      const { data } = await api().post('/multimodal/communication', { transcript: commTranscript });
      setCommResult(data);
      toast.success('Communication scored!');
    } catch { toast.error('Communication analysis failed.'); }
    finally { setCommLoading(false); }
  };

  const emotionColor = (e) => ({
    happy: 'text-emerald-400', neutral: 'text-blue-400', surprised: 'text-amber-400',
    sad: 'text-rose-400', angry: 'text-red-500', fearful: 'text-indigo-400', disgusted: 'text-violet-400',
  })[e] || 'text-slate-300';

  const emotionEmoji = (e) => ({
    happy: '😊', neutral: '😐', surprised: '😮', sad: '😢', angry: '😠', fearful: '😨', disgusted: '🤢'
  })[e] || '🎭';

  const TABS = [
    { id: 'github', label: 'GitHub', icon: <FaGithub size={16} /> },
    { id: 'audio',  label: 'Audio Voice',  icon: <Mic size={16} /> },
    { id: 'video',  label: 'Face Emotion', icon: <Camera size={16} /> },
    { id: 'comm',   label: 'Communication', icon: <MessageSquare size={16} /> },
  ];

  return (
    <div className="bg-transparent py-6 px-4 relative z-10">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-1">
            <Layers size={13} className="animate-pulse" />
            <span>MULTIMODAL INTELLIGENCE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient-glow">
            AI Multimodal Engine
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Analyze your GitHub activity, voice confidence, video facial expressions, and communication transcripts to gauge total readiness.
          </p>
        </motion.div>

        {/* Sliding Tabs */}
        <div className="flex flex-wrap gap-2 justify-center bg-slate-950/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md max-w-xl mx-auto">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 z-10 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMultimodalTab"
                    className="absolute inset-0 bg-primary/20 border border-primary/40 rounded-xl -z-10 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Tabs */}
        <AnimatePresence mode="wait">
          {/* ── GITHUB ── */}
          {activeTab === 'github' && (
            <motion.div 
              key="github" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="glass-panel card-glow p-6 md:p-8 rounded-3xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <FaGithub size={20} className="text-primary" />
                    GitHub Profile Analyzer
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Retrieve repositories and commits info to analyze technical depth, language variety, and code quality.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">GitHub Username *</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm" 
                      placeholder="e.g. torvalds"
                      value={githubUsername} 
                      onChange={e => setGithubUsername(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      GitHub Personal Access Token <span className="text-slate-500 text-xxs font-normal lowercase">(optional, bypasses API rate limits)</span>
                    </label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm" 
                      type="password" 
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={githubToken} 
                      onChange={e => setGithubToken(e.target.value)} 
                    />
                  </div>
                </div>

                <button 
                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 disabled:pointer-events-none" 
                  onClick={analyzeGitHub} 
                  disabled={githubLoading}
                >
                  {githubLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Analyzing Commits & Repositories…</span>
                    </>
                  ) : (
                    <>
                      <FaGithub size={16} />
                      <span>Analyze Profile Intelligence</span>
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {githubResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 border border-white/10"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/10">
                          {githubResult.username?.[0]?.toUpperCase() || '@'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                            @{githubResult.username}
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xxs text-primary font-medium">Verified profile</span>
                          </h3>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {githubResult.publicRepos || 0} repositories &bull; {githubResult.followers || 0} followers
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xxs text-slate-500 uppercase tracking-wider font-semibold">Overall Technical Power</p>
                          <p className="text-2xl font-black text-emerald-400">
                            {Math.round(((githubResult.technicalDepth || 0) + (githubResult.openSourceScore || 0) + (githubResult.projectQuality || 0)) / 3)}
                            <span className="text-xs text-slate-500 font-medium font-mono">/100</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Score Bar Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ScoreBar label="Technical Depth" value={githubResult.technicalDepth || 0} color="#6366f1" />
                      <ScoreBar label="Code Diversity" value={githubResult.codeDiversity || 0} color="#10b981" />
                      <ScoreBar label="Open Source Score" value={githubResult.openSourceScore || 0} color="#f59e0b" />
                      <ScoreBar label="Project Quality" value={githubResult.projectQuality || 0} color="#ec4899" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      <div className="bg-slate-900/20 border border-white/5 p-5 rounded-2xl space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-primary" />
                          Top Language Stack
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {githubResult.topLanguages?.map((l, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-950/50 border border-white/5 text-xs text-slate-300 font-medium">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-900/20 border border-white/5 p-5 rounded-2xl space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Award size={14} className="text-violet-400" />
                          Standout Repository Highlights
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {githubResult.standoutProjects?.length > 0 ? (
                            githubResult.standoutProjects.map((p, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-semibold">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-xs italic">No major public repositories pinned.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Summaries */}
                    <div className="space-y-4 pt-2">
                      <div className="p-5 rounded-2xl bg-slate-900/40 border-l-2 border-indigo-500 border border-white/5 space-y-1">
                        <p className="text-xxs font-bold text-indigo-400 uppercase tracking-wider">AI Developer Personality Profile</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{githubResult.profileSummary}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-amber-500/5 border-l-2 border-amber-500 border border-amber-500/10 space-y-1">
                        <p className="text-xxs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles size={12} />
                          Targeted Growth Roadmap Recommendation
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed">{githubResult.topRecommendation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── AUDIO ── */}
          {activeTab === 'audio' && (
            <motion.div 
              key="audio" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="glass-panel card-glow p-6 md:p-8 rounded-3xl space-y-5">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Mic size={20} className="text-rose-500 animate-pulse" />
                    Speech Confidence & Tone Analyzer
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Record your answer response to check pacing, vocabulary filler words, and overall presentation scores.
                  </p>
                </div>

                {/* Microphone Visualizer Overlay */}
                {recording && (
                  <div className="bg-slate-950/60 rounded-2xl border border-rose-500/20 p-8 flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-end justify-center gap-1.5 h-12">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [12, 48, 12] }}
                          transition={{
                            duration: 0.6 + (i % 3) * 0.15,
                            repeat: Infinity,
                            delay: i * 0.05,
                            ease: "easeInOut"
                          }}
                          className="w-1.5 bg-rose-500 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest animate-pulse">Capturing Live Input Streams...</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {!recording ? (
                    <button 
                      className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] text-white font-semibold flex items-center gap-2 transition-all" 
                      onClick={startRecording}
                    >
                      <Mic size={16} />
                      <span>Start Voice Recording</span>
                    </button>
                  ) : (
                    <button 
                      className="px-5 py-3 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white font-semibold flex items-center gap-2 transition-all animate-pulse" 
                      onClick={stopRecording}
                    >
                      <Square size={16} className="text-rose-400 fill-current" />
                      <span>Stop & Capture</span>
                    </button>
                  )}

                  <label className="px-5 py-3 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 font-medium flex items-center gap-2 cursor-pointer transition-all">
                    <span>📂 Upload File</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="audio/*"
                      onChange={e => { if (e.target.files[0]) setAudioFile(e.target.files[0]); }} 
                    />
                  </label>

                  {audioFile && (
                    <button 
                      className="px-5 py-3 rounded-xl bg-primary text-white font-semibold flex items-center gap-2 hover:opacity-90 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50" 
                      onClick={() => analyzeAudio(null)} 
                      disabled={audioLoading}
                    >
                      {audioLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      <span>{audioLoading ? 'Analyzing Audio Waves…' : 'Trigger Audio Analysis'}</span>
                    </button>
                  )}
                </div>

                {audioFile && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                    <CheckCircle2 size={14} />
                    <span>Selected Audio: <strong>{audioFile.name}</strong> ready for parsing.</span>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {audioResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass-panel p-6 md:p-8 rounded-3xl space-y-6"
                  >
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Award size={18} className="text-emerald-400" />
                      Voice Diagnostics Results
                    </h3>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Tone Confidence', value: audioResult.confidenceScore, unit: '%', color: 'text-rose-400' },
                        { label: 'Speech Pacing', value: audioResult.speechRatePct, unit: ' wpm', color: 'text-emerald-400' },
                        { label: 'Total Hesitations', value: audioResult.hesitationCount, unit: ' times', color: 'text-amber-400' },
                        { label: 'Identified Words', value: audioResult.wordCount, unit: ' words', color: 'text-indigo-400' },
                      ].map((s, i) => (
                        <div key={i} className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 space-y-1">
                          <p className="text-xxs text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
                          <p className={`text-2xl font-black ${s.color}`}>
                            {s.value}
                            <span className="text-xs font-normal text-slate-500 ml-1">{s.unit}</span>
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Filler words tag cloud */}
                    {audioResult.fillerWords && Object.keys(audioResult.fillerWords).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filler Word Statistics</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(audioResult.fillerWords).map(([word, count]) => (
                            <span key={word} className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
                              "{word}" &bull; {count} uses
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transcript card */}
                    {audioResult.transcript && (
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Speech to Text Transcript</p>
                          <button 
                            className="text-xs text-primary hover:text-white font-semibold flex items-center gap-1 transition-colors"
                            onClick={() => {
                              setCommTranscript(audioResult.transcript);
                              setActiveTab('comm');
                              toast.success('Transcript loaded into Communication Scorer!');
                            }}
                          >
                            <span>Use in Communication Analyzer</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                        <p className="text-sm bg-slate-950/40 border border-white/5 rounded-2xl p-5 text-slate-300 leading-relaxed">
                          {audioResult.transcript}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── VIDEO EMOTION ── */}
          {activeTab === 'video' && (
            <motion.div 
              key="video" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="glass-panel card-glow p-6 md:p-8 rounded-3xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Video size={20} className="text-indigo-400" />
                    Facial Expression & Sentiment Reader
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Turn on your camera feed, smile, and analyze your facial emotion during mock simulations.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {!cameraStream ? (
                    <button 
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white font-semibold flex items-center gap-2 transition-all" 
                      onClick={startCamera}
                    >
                      <Camera size={16} />
                      <span>Start Camera Stream</span>
                    </button>
                  ) : (
                    <button 
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-50" 
                      onClick={captureAndAnalyze} 
                      disabled={videoLoading}
                    >
                      {videoLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Processing Capture…</span>
                        </>
                      ) : (
                        <>
                          <Camera size={16} />
                          <span>Capture snapshot & score</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {cameraStream && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 max-w-md mx-auto aspect-video bg-slate-950 flex items-center justify-center">
                    <video ref={videoRef} autoPlay className="w-full h-full object-cover scale-x-[-1]" />
                    
                    {/* Viewfinder crosshairs */}
                    <div className="absolute inset-4 border border-dashed border-white/20 pointer-events-none rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 border-l border-t border-indigo-400 absolute top-0 left-0" />
                      <div className="w-6 h-6 border-r border-t border-indigo-400 absolute top-0 right-0" />
                      <div className="w-6 h-6 border-l border-b border-indigo-400 absolute bottom-0 left-0" />
                      <div className="w-6 h-6 border-r border-b border-indigo-400 absolute bottom-0 right-0" />
                      
                      {/* Pulse dot */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-md border border-white/10 text-xxs font-bold text-red-500">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>LIVE FEED</span>
                      </div>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <AnimatePresence>
                {videoResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass-panel p-6 md:p-8 rounded-3xl space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center justify-center text-4xl shadow-inner">
                          {emotionEmoji(videoResult.dominantEmotion)}
                        </div>
                        <div>
                          <p className="text-xxs text-slate-500 uppercase tracking-wider font-semibold">Dominant Sentiment</p>
                          <h3 className={`text-2xl font-black capitalize ${emotionColor(videoResult.dominantEmotion)}`}>
                            {videoResult.dominantEmotion}
                          </h3>
                        </div>
                      </div>

                      <div className="stat bg-slate-950/40 border border-white/5 rounded-2xl p-4 sm:text-right max-w-xs">
                        <p className="text-xxs text-slate-500 uppercase tracking-wider font-semibold">Recognition Confidence</p>
                        <p className="text-2xl font-black text-indigo-400">
                          {videoResult.confidence?.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Emotion bar matrix */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emotion Intensity Spectrum</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {videoResult.emotions && Object.entries(videoResult.emotions)
                          .sort((a, b) => b[1] - a[1])
                          .map(([emotion, score]) => (
                            <div key={emotion} className="bg-slate-900/20 border border-white/5 p-4 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="capitalize font-semibold text-slate-300 flex items-center gap-1.5">
                                  <span className="text-lg">{emotionEmoji(emotion)}</span>
                                  {emotion}
                                </span>
                                <span className="font-mono text-slate-400">{score.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${score}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-primary" 
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── COMMUNICATION ── */}
          {activeTab === 'comm' && (
            <motion.div 
              key="comm" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="glass-panel card-glow p-6 md:p-8 rounded-3xl space-y-5">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <MessageSquare size={20} className="text-primary" />
                    Speech Quality Scorer
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Provide the transcript text of your responses to grade structural professionalism, technical vocabulary, and clarity.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Response Transcript</label>
                  <textarea 
                    className="w-full p-4 rounded-2xl bg-slate-950/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm h-36 resize-none"
                    placeholder="Type or paste your answer here, or analyze voice recording above to auto-populate..."
                    value={commTranscript} 
                    onChange={e => setCommTranscript(e.target.value)} 
                  />
                </div>

                <button 
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50" 
                  onClick={analyzeCommunication} 
                  disabled={commLoading}
                >
                  {commLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Scoring Professionalism…</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare size={16} />
                      <span>Analyze Communication Quality</span>
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {commResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass-panel p-6 md:p-8 rounded-3xl space-y-6"
                  >
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldCheck size={18} className="text-indigo-400" />
                      Communication Quality Metrics
                    </h3>

                    {/* Scores layout */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Overall Score', value: commResult.overallCommunicationScore, color: 'text-indigo-400' },
                        { label: 'Word Clarity', value: commResult.clarityScore, color: 'text-emerald-400' },
                        { label: 'Professionalism', value: commResult.professionalismScore, color: 'text-amber-400' },
                        { label: 'Technical Depth', value: commResult.technicalDepthScore, color: 'text-pink-400' },
                      ].map((s, i) => (
                        <div key={i} className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 text-center space-y-1">
                          <p className="text-xxs text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
                          <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                          <p className="text-xxs text-slate-500">/100</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 pt-2">
                      {commResult.strength && (
                        <div className="p-5 rounded-2xl bg-emerald-500/5 border-l-2 border-emerald-500 border border-emerald-500/10 space-y-1.5">
                          <p className="text-xxs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <Smile size={14} />
                            Key Communication Strength
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed">{commResult.strength}</p>
                        </div>
                      )}

                      {commResult.suggestions?.length > 0 && (
                        <div className="bg-slate-900/20 border border-white/5 p-5 rounded-2xl space-y-3">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-amber-400" />
                            Constructive Enhancement Feedback
                          </p>
                          <ul className="space-y-2">
                            {commResult.suggestions.filter(Boolean).map((s, i) => (
                              <li key={i} className="flex gap-3 text-sm text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                <span className="text-amber-400 font-bold shrink-0 font-mono">{i + 1}.</span>
                                <span className="leading-relaxed">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
