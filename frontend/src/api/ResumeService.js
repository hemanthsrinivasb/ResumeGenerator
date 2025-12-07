import axios from "axios";

export const baseURLL = "http://localhost:8050";

export const axiosInstance = axios.create({
  baseURL: baseURLL,
});

export const generateResume = async (description) => {
  const response = await axiosInstance.post("/api/v1/resume/generate", {
    userDescription: description,
  });

  return response.data;
};

export const analyzeResume = async (resumeData, jobDescription) => {
  const response = await axiosInstance.post("/api/v1/resume/analyze", {
    resumeData,
    jobDescription,
  });
  return response.data;
};

export const generateCoverLetter = async (resumeData, jobDescription) => {
  const response = await axiosInstance.post("/api/v1/resume/cover-letter", {
    resumeData,
    jobDescription,
  });
  return response.data;
};