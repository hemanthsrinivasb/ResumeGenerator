package com.resume.backend.demo.dto;

public record AuthResponse(
    String token,
    String name,
    String email
) {}
