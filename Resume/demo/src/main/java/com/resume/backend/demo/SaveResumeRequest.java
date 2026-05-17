package com.resume.backend.demo;

import java.util.Map;

public record SaveResumeRequest(
    String title,
    Map<String, Object> resumeData
) {}
