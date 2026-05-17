import axios from "axios";

export const baseURLL = "http://localhost:8050";

// ── Auth helpers ───────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("jwt_token");
export const getUser  = () => {
  try { return JSON.parse(localStorage.getItem("auth_user")); }
  catch { return null; }
};
export const isLoggedIn = () => !!getToken();

export const logout = () => {
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("auth_user");
};

// ── Axios instance with auto JWT header ───────────────────────────
export const axiosInstance = axios.create({ baseURL: baseURLL });

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth API ───────────────────────────────────────────────────────
export const registerUser = async (name, email, password) => {
  const res = await axiosInstance.post("/api/v1/auth/register", { name, email, password });
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await axiosInstance.post("/api/v1/auth/login", { email, password });
  const { token, name } = res.data;
  localStorage.setItem("jwt_token", token);
  localStorage.setItem("auth_user", JSON.stringify({ name, email }));
  return res.data;
};

// ── Core AI endpoints ──────────────────────────────────────────────
export const generateResume = async (description) => {
  const res = await axiosInstance.post("/api/v1/resume/generate", { userDescription: description });
  return res.data;
};

export const analyzeResume = async (resumeData, jobDescription) => {
  const res = await axiosInstance.post("/api/v1/resume/analyze", { resumeData, jobDescription });
  return res.data;
};

export const generateCoverLetter = async (resumeData, jobDescription) => {
  const res = await axiosInstance.post("/api/v1/resume/cover-letter", { resumeData, jobDescription });
  return res.data;
};

// ── New Tier 2/3 AI endpoints ──────────────────────────────────────
export const generateInterviewQuestions = async (resumeData, jobDescription) => {
  const res = await axiosInstance.post("/api/v1/resume/interview-questions", { resumeData, jobDescription });
  return res.data;
};

export const generateSkillsGap = async (resumeData, jobDescription) => {
  const res = await axiosInstance.post("/api/v1/resume/skills-gap", { resumeData, jobDescription });
  return res.data;
};

export const generateLinkedinPost = async (resumeData, targetRole) => {
  const res = await axiosInstance.post("/api/v1/resume/linkedin-post", { resumeData, targetRole });
  return res.data;
};

// ── SSE Streaming ──────────────────────────────────────────────────
export const streamResume = async (description, onToken, onDone, onError) => {
  try {
    const response = await fetch(`${baseURLL}/api/v1/resume/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: JSON.stringify({ userDescription: description }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const token = line.slice(5).trim();
          if (token === "[DONE]") {
            onDone(accumulated);
            return;
          }
          accumulated += token;
          onToken(accumulated);
        }
      }
    }
    onDone(accumulated);
  } catch (err) {
    onError(err);
  }
};

// ── Resume history (JWT required) ──────────────────────────────────
export const saveResume = async (title, resumeData) => {
  const res = await axiosInstance.post("/api/v1/resume/save", { title, resumeData });
  return res.data;
};

export const getResumeHistory = async () => {
  const res = await axiosInstance.get("/api/v1/resume/history");
  return res.data;
};

export const loadResume = async (id) => {
  const res = await axiosInstance.get(`/api/v1/resume/history/${id}`);
  return res.data;
};

export const deleteResume = async (id) => {
  await axiosInstance.delete(`/api/v1/resume/history/${id}`);
};

// ── Public share ───────────────────────────────────────────────────
export const getSharedResume = async (shareCode) => {
  const res = await axiosInstance.get(`/api/v1/resume/share/${shareCode}`);
  return res.data;
};
