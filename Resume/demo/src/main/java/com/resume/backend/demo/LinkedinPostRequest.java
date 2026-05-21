package com.resume.backend.demo;

import java.util.Map;

public record LinkedinPostRequest(
    Map<String, Object> resumeData,
    String targetRole
) {}
