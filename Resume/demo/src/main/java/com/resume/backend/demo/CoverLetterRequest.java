package com.resume.backend.demo;

import java.util.Map;

public record CoverLetterRequest(Map<String, Object> resumeData, String jobDescription) {
}
