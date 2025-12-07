package com.resume.backend.demo;

import java.util.Map;

public record AnalyzeResumeRequest(Map<String, Object> resumeData, String jobDescription) {
}
