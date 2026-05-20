import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Loader2, Github, Mic, Camera, CheckCircle } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getToken } from '../api/ResumeService';

const api = () => axios.create({
  baseURL: '/api/v1',
  headers: { Authorization: `Bearer ${getToken()}` },
});

const ScoreBar = ({ label, value, color = '#6366f1' }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-base-content/70">{label}</span>
      <span className="font-bold">{value}/100</span>
    </div>
    <div className="w-full bg-base-200 rounded-full h-2">
      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
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
    happy: 'text-success', neutral: 'text-info', surprised: 'text-warning',
    sad: 'text-error', angry: 'text-error', fearful: 'text-warning', disgusted: 'text-error',
  })[e] || 'text-base-content';

  const TABS = [
    { id: 'github', label: '🐙 GitHub', icon: <Github size={16} /> },
    { id: 'audio',  label: '🎙 Audio',  icon: <Mic size={16} /> },
    { id: 'video',  label: '📷 Emotion', icon: <Camera size={16} /> },
    { id: 'comm',   label: '💬 Communication', icon: null },
  ];

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Layers className="text-primary" size={36} />
            <h1 className="text-4xl font-bold">Multimodal AI Engine</h1>
          </div>
          <p className="text-base-content/60 text-lg">GitHub intelligence, voice confidence analysis, emotion detection, and communication scoring.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center">
          {TABS.map(tab => (
            <button key={tab.id}
              className={`btn btn-sm gap-2 ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── GITHUB ── */}
          {activeTab === 'github' && (
            <motion.div key="github" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-5">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body space-y-3">
                  <h2 className="font-bold">GitHub Profile Intelligence</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label"><span className="label-text">GitHub Username *</span></label>
                      <input className="input input-bordered w-full" placeholder="e.g. torvalds"
                        value={githubUsername} onChange={e => setGithubUsername(e.target.value)} />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">GitHub Token <span className="text-base-content/40 text-xs">(optional, for higher rate limit)</span></span></label>
                      <input className="input input-bordered w-full" type="password" placeholder="ghp_..."
                        value={githubToken} onChange={e => setGithubToken(e.target.value)} />
                    </div>
                  </div>
                  <button className="btn btn-primary gap-2" onClick={analyzeGitHub} disabled={githubLoading}>
                    {githubLoading ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
                    {githubLoading ? 'Analyzing…' : 'Analyze GitHub Profile'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {githubResult && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="card bg-base-100 shadow-md">
                      <div className="card-body space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-12">
                              <span className="text-lg">{githubResult.username?.[0]?.toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-bold">@{githubResult.username}</p>
                            <p className="text-xs text-base-content/50">{githubResult.publicRepos} repos · {githubResult.followers} followers</p>
                          </div>
                        </div>
                        <div className="divider my-1" />
                        <div className="space-y-3">
                          <ScoreBar label="Technical Depth"   value={githubResult.technicalDepth}  color="#6366f1" />
                          <ScoreBar label="Code Diversity"    value={githubResult.codeDiversity}   color="#22c55e" />
                          <ScoreBar label="Open Source Score" value={githubResult.openSourceScore} color="#f59e0b" />
                          <ScoreBar label="Project Quality"   value={githubResult.projectQuality}  color="#ec4899" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-base-content/60 mb-1">TOP LANGUAGES</p>
                          <div className="flex flex-wrap gap-1">
                            {githubResult.topLanguages?.map((l, i) => (
                              <span key={i} className="badge badge-ghost badge-sm">{l}</span>
                            ))}
                          </div>
                        </div>
                        {githubResult.standoutProjects?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-base-content/60 mb-1">STANDOUT PROJECTS</p>
                            <div className="flex flex-wrap gap-1">
                              {githubResult.standoutProjects.map((p, i) => (
                                <span key={i} className="badge badge-primary badge-sm">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="bg-base-200 rounded-xl p-3">
                          <p className="text-xs font-semibold text-base-content/60 mb-1">AI PROFILE SUMMARY</p>
                          <p className="text-sm">{githubResult.profileSummary}</p>
                        </div>
                        <div className="bg-warning/10 border border-warning/30 rounded-xl p-3">
                          <p className="text-xs font-semibold text-warning mb-1">🎯 TOP RECOMMENDATION</p>
                          <p className="text-sm">{githubResult.topRecommendation}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── AUDIO ── */}
          {activeTab === 'audio' && (
            <motion.div key="audio" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-5">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body space-y-4">
                  <h2 className="font-bold">Voice Confidence Analyzer</h2>
                  <p className="text-sm text-base-content/60">Record yourself answering an interview question. AI transcribes and scores your confidence, speech rate, and hesitations.</p>
                  <div className="flex gap-3 flex-wrap">
                    {!recording
                      ? <button className="btn btn-error gap-2" onClick={startRecording}>
                          <Mic size={16} /> Start Recording
                        </button>
                      : <button className="btn btn-neutral gap-2 animate-pulse" onClick={stopRecording}>
                          ⏹ Stop Recording
                        </button>
                    }
                    <label className="btn btn-ghost gap-2 cursor-pointer">
                      📂 Upload Audio
                      <input type="file" className="hidden" accept="audio/*"
                        onChange={e => { if (e.target.files[0]) setAudioFile(e.target.files[0]); }} />
                    </label>
                    {audioFile && (
                      <button className="btn btn-primary gap-2" onClick={() => analyzeAudio(null)} disabled={audioLoading}>
                        {audioLoading ? <Loader2 size={16} className="animate-spin" /> : '🔍'}
                        {audioLoading ? 'Analyzing…' : 'Analyze'}
                      </button>
                    )}
                  </div>
                  {audioFile && <p className="text-xs text-success">✅ Ready: {audioFile.name}</p>}
                </div>
              </div>

              <AnimatePresence>
                {audioResult && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="card bg-base-100 shadow-md">
                    <div className="card-body space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Confidence', value: audioResult.confidenceScore, unit: '/100', color: 'text-primary' },
                          { label: 'Speech Rate', value: audioResult.speechRatePct, unit: ' wpm', color: 'text-success' },
                          { label: 'Hesitations', value: audioResult.hesitationCount, unit: '', color: 'text-warning' },
                          { label: 'Words', value: audioResult.wordCount, unit: '', color: 'text-info' },
                        ].map((s, i) => (
                          <div key={i} className="stat bg-base-200 rounded-xl p-3">
                            <p className="text-xs text-base-content/50">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}<span className="text-sm font-normal">{s.unit}</span></p>
                          </div>
                        ))}
                      </div>
                      {audioResult.fillerWords && Object.keys(audioResult.fillerWords).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-base-content/60 mb-2">FILLER WORDS DETECTED</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(audioResult.fillerWords).map(([word, count]) => (
                              <span key={word} className="badge badge-warning">"{word}" ×{count}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {audioResult.transcript && (
                        <div>
                          <p className="text-xs font-semibold text-base-content/60 mb-1">TRANSCRIPT</p>
                          <p className="text-sm bg-base-200 rounded-xl p-3">{audioResult.transcript}</p>
                          <button className="btn btn-xs btn-ghost mt-2" onClick={() => setCommTranscript(audioResult.transcript)}>
                            → Use in Communication Analyzer
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── VIDEO EMOTION ── */}
          {activeTab === 'video' && (
            <motion.div key="video" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-5">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body space-y-4">
                  <h2 className="font-bold">Emotion Detection</h2>
                  <p className="text-sm text-base-content/60">AI analyzes your facial expression from a camera snapshot during an interview simulation.</p>
                  <div className="flex gap-3 flex-wrap">
                    {!cameraStream
                      ? <button className="btn btn-primary gap-2" onClick={startCamera}>
                          <Camera size={16} /> Open Camera
                        </button>
                      : <button className="btn btn-success gap-2" onClick={captureAndAnalyze} disabled={videoLoading}>
                          {videoLoading ? <Loader2 size={16} className="animate-spin" /> : '📸'}
                          Capture & Analyze
                        </button>
                    }
                  </div>
                  {cameraStream && (
                    <video ref={videoRef} autoPlay className="w-full max-w-sm rounded-xl shadow-md" />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              <AnimatePresence>
                {videoResult && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="card bg-base-100 shadow-md">
                    <div className="card-body">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-6xl">{
                          { happy: '😊', neutral: '😐', surprised: '😮', sad: '😢', angry: '😠', fearful: '😨', disgusted: '🤢' }
                          [videoResult.dominantEmotion] || '🎭'
                        }</div>
                        <div>
                          <p className="text-xs text-base-content/50 mb-1">DOMINANT EMOTION</p>
                          <p className={`text-2xl font-bold capitalize ${emotionColor(videoResult.dominantEmotion)}`}>
                            {videoResult.dominantEmotion}
                          </p>
                          <p className="text-sm text-base-content/50">Confidence: {videoResult.confidence?.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {videoResult.emotions && Object.entries(videoResult.emotions)
                          .sort((a, b) => b[1] - a[1])
                          .map(([emotion, score]) => (
                            <div key={emotion} className="flex items-center gap-3">
                              <span className="text-xs w-20 capitalize text-base-content/70">{emotion}</span>
                              <div className="flex-1 bg-base-200 rounded-full h-2">
                                <div className="h-2 rounded-full bg-primary transition-all duration-700"
                                  style={{ width: `${score}%` }} />
                              </div>
                              <span className="text-xs w-10 text-right">{score.toFixed(0)}%</span>
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
            <motion.div key="comm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-5">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body space-y-3">
                  <h2 className="font-bold">Communication Quality Scorer</h2>
                  <p className="text-sm text-base-content/60">Paste or use the auto-filled transcript from Audio Analysis. AI scores clarity, professionalism, and technical depth.</p>
                  <textarea className="textarea textarea-bordered w-full h-32 resize-none text-sm"
                    placeholder="Paste your answer transcript here or analyze audio first to auto-fill…"
                    value={commTranscript} onChange={e => setCommTranscript(e.target.value)} />
                  <button className="btn btn-primary gap-2" onClick={analyzeCommunication} disabled={commLoading}>
                    {commLoading ? <Loader2 size={16} className="animate-spin" /> : '💬'}
                    {commLoading ? 'Scoring…' : 'Score Communication'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {commResult && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="card bg-base-100 shadow-md">
                    <div className="card-body space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Overall', value: commResult.overallCommunicationScore, color: '#6366f1' },
                          { label: 'Clarity', value: commResult.clarityScore, color: '#22c55e' },
                          { label: 'Professionalism', value: commResult.professionalismScore, color: '#f59e0b' },
                          { label: 'Technical Depth', value: commResult.technicalDepthScore, color: '#ec4899' },
                        ].map((s, i) => (
                          <div key={i} className="stat bg-base-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-base-content/50 mb-1">{s.label}</p>
                            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-xs text-base-content/40">/100</p>
                          </div>
                        ))}
                      </div>
                      {commResult.strength && (
                        <div className="bg-success/10 border border-success/30 rounded-xl p-3">
                          <p className="text-xs font-bold text-success mb-1">✅ STRENGTH</p>
                          <p className="text-sm">{commResult.strength}</p>
                        </div>
                      )}
                      {commResult.suggestions?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-base-content/60 mb-2">IMPROVEMENT SUGGESTIONS</p>
                          <ul className="space-y-2">
                            {commResult.suggestions.filter(Boolean).map((s, i) => (
                              <li key={i} className="flex gap-2 text-sm bg-base-200 rounded-xl p-2">
                                <span className="text-warning font-bold shrink-0">{i + 1}.</span>
                                {s}
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
