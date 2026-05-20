package com.resume.backend.demo.controller;

import com.resume.backend.demo.service.MultimodalAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/multimodal")
@RequiredArgsConstructor
@Tag(name = "Multimodal AI", description = "Audio analysis, video emotion detection, and GitHub profile intelligence")
public class MultimodalController {

    private final MultimodalAnalysisService multimodalService;

    @PostMapping("/audio-analyze")
    @Operation(summary = "Analyze audio: transcription, speech rate, confidence, hesitation",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> analyzeAudio(
            @RequestParam("file") MultipartFile audioFile) {
        return ResponseEntity.ok(multimodalService.analyzeAudio(audioFile));
    }

    @PostMapping("/video-frame")
    @Operation(summary = "Analyze a video frame for emotion detection",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> analyzeVideoFrame(
            @RequestParam("file") MultipartFile imageFile) {
        return ResponseEntity.ok(multimodalService.analyzeVideoFrame(imageFile));
    }

    @PostMapping("/communication")
    @Operation(summary = "Score communication quality from a transcript",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> analyzeCommunication(
            @RequestBody Map<String, String> body) {
        String transcript = body.getOrDefault("transcript", "");
        if (transcript.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "transcript is required"));
        }
        return ResponseEntity.ok(multimodalService.analyzeCommunication(transcript));
    }

    @PostMapping("/github-analyze")
    @Operation(summary = "Analyze a GitHub profile for technical maturity scores",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> analyzeGitHub(
            @RequestBody Map<String, String> body) {
        String username = body.getOrDefault("githubUsername", "");
        String token    = body.getOrDefault("githubToken", "");
        if (username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "githubUsername is required"));
        }
        return ResponseEntity.ok(multimodalService.analyzeGitHub(username, token));
    }
}
