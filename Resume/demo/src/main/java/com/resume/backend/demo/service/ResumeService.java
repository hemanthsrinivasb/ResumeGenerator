package com.resume.backend.demo.service;

import java.io.IOException;
import java.util.Map;

public interface ResumeService {
    Map<String, Object> generateResumeResponse(String userResumeDescription) throws IOException;

    Map<String, Object> analyzeResume(Map<String, Object> resumeData, String jobDescription) throws IOException;

    Map<String, Object> generateCoverLetter(Map<String, Object> resumeData, String jobDescription) throws IOException;
}
