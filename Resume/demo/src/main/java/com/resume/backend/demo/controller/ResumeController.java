package com.resume.backend.demo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.backend.demo.*;
import com.resume.backend.demo.model.ResumeHistory;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.repository.ResumeHistoryRepository;
import com.resume.backend.demo.service.EmbeddingService;
import com.resume.backend.demo.service.ResumeService;
import com.resume.backend.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/api/v1/resume")
@Tag(name = "Resume AI", description = "AI-powered resume generation, analysis, and career tools")
public class ResumeController {

    private final ResumeService resumeService;
    private final ResumeHistoryRepository historyRepository;
    private final UserService userService;
    private final EmbeddingService embeddingService;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeController(ResumeService resumeService,
                            ResumeHistoryRepository historyRepository,
                            UserService userService,
                            EmbeddingService embeddingService,
                            ChatClient.Builder chatClientBuilder) {
        this.resumeService = resumeService;
        this.historyRepository = historyRepository;
        this.userService = userService;
        this.embeddingService = embeddingService;
        this.chatClient = chatClientBuilder.build();
    }

    // ── Core AI endpoints (public) ─────────────────────────────────

    @PostMapping("/generate")
    @Operation(summary = "Generate a resume from a text description using AI")
    public ResponseEntity<Map<String, Object>> generateResume(
            @RequestBody Resumerequest request) throws IOException {
        return ResponseEntity.ok(resumeService.generateResumeResponse(request.userDescription()));
    }

    @PostMapping("/analyze")
    @Operation(summary = "Analyze resume against a job description — returns ATS score")
    public ResponseEntity<Map<String, Object>> analyzeResume(
            @RequestBody AnalyzeResumeRequest request) throws IOException {
        return ResponseEntity.ok(resumeService.analyzeResume(request.resumeData(), request.jobDescription()));
    }

    @PostMapping("/cover-letter")
    @Operation(summary = "Generate a professional cover letter")
    public ResponseEntity<Map<String, Object>> generateCoverLetter(
            @RequestBody CoverLetterRequest request) throws IOException {
        return ResponseEntity.ok(resumeService.generateCoverLetter(request.resumeData(), request.jobDescription()));
    }

    @PostMapping("/interview-questions")
    @Operation(summary = "Generate tailored interview questions based on the resume + job description")
    public ResponseEntity<Map<String, Object>> generateInterviewQuestions(
            @RequestBody InterviewQuestionsRequest request) throws IOException {
        return ResponseEntity.ok(
                resumeService.generateInterviewQuestions(request.resumeData(), request.jobDescription()));
    }

    @PostMapping("/skills-gap")
    @Operation(summary = "Identify skill gaps between the resume and target job description")
    public ResponseEntity<Map<String, Object>> analyzeSkillsGap(
            @RequestBody SkillsGapRequest request) throws IOException {
        return ResponseEntity.ok(
                resumeService.generateSkillsGap(request.resumeData(), request.jobDescription()));
    }

    @PostMapping("/linkedin-post")
    @Operation(summary = "Generate a LinkedIn announcement post from a resume + target role")
    public ResponseEntity<Map<String, Object>> generateLinkedinPost(
            @RequestBody LinkedinPostRequest request) throws IOException {
        return ResponseEntity.ok(
                resumeService.generateLinkedinPost(request.resumeData(), request.targetRole()));
    }

    // ── SSE Streaming (public) ─────────────────────────────────────

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream resume generation token-by-token via Server-Sent Events")
    public SseEmitter streamResumeGeneration(@RequestBody Resumerequest request) {
        SseEmitter emitter = new SseEmitter(120_000L);

        CompletableFuture.runAsync(() -> {
            try {
                String promptContent = resumeService.buildResumePrompt(request.userDescription());
                Prompt prompt = new Prompt(promptContent);

                chatClient.prompt(prompt)
                        .stream()
                        .content()
                        .subscribe(
                                token -> {
                                    try {
                                        emitter.send(SseEmitter.event().name("token").data(token));
                                    } catch (IOException e) {
                                        emitter.completeWithError(e);
                                    }
                                },
                                error -> {
                                    log.error("SSE stream error: {}", error.getMessage());
                                    emitter.completeWithError(error);
                                },
                                () -> {
                                    try {
                                        emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                                        emitter.complete();
                                    } catch (IOException e) {
                                        emitter.completeWithError(e);
                                    }
                                }
                        );
            } catch (Exception e) {
                log.error("SSE setup error: {}", e.getMessage());
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    // ── Resume History (JWT required) ──────────────────────────────

    @PostMapping("/save")
    @Operation(summary = "Save resume to history", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> saveResume(
            @RequestBody SaveResumeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {

        User user = userService.findByEmail(userDetails.getUsername());
        String resumeJson = objectMapper.writeValueAsString(request.resumeData());
        String shareCode  = UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        ResumeHistory history = ResumeHistory.builder()
                .user(user)
                .title(request.title())
                .resumeData(resumeJson)
                .shareCode(shareCode)
                .build();

        historyRepository.save(history);

        // Auto-embed resume into PGVector for RAG-powered chatbot context
        embeddingService.embedResume(resumeJson, user.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", history.getId(),
                "title", history.getTitle(),
                "shareCode", shareCode
        ));
    }

    @GetMapping("/history")
    @Operation(summary = "List all saved resumes for the logged-in user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        List<Map<String, Object>> result = historyRepository
                .findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(h -> Map.<String, Object>of(
                        "id",        h.getId(),
                        "title",     h.getTitle(),
                        "shareCode", h.getShareCode() != null ? h.getShareCode() : "",
                        "createdAt", h.getCreatedAt().toString()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/history/{id}")
    @Operation(summary = "Load a specific saved resume", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> loadResume(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {

        User user = userService.findByEmail(userDetails.getUsername());
        ResumeHistory history = historyRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        Map<String, Object> data = objectMapper.readValue(history.getResumeData(), Map.class);
        return ResponseEntity.ok(Map.of("id", history.getId(), "title", history.getTitle(), "data", data));
    }

    @DeleteMapping("/history/{id}")
    @Operation(summary = "Delete a saved resume", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deleteResume(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        historyRepository.findByIdAndUser(id, user).ifPresent(historyRepository::delete);
        return ResponseEntity.noContent().build();
    }

    // ── Public share link ──────────────────────────────────────────

    @GetMapping("/share/{shareCode}")
    @Operation(summary = "View a publicly shared resume by its share code")
    public ResponseEntity<Map<String, Object>> viewSharedResume(@PathVariable String shareCode) throws Exception {
        ResumeHistory history = historyRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new RuntimeException("Shared resume not found"));

        Map<String, Object> data = objectMapper.readValue(history.getResumeData(), Map.class);
        return ResponseEntity.ok(Map.of("title", history.getTitle(), "data", data));
    }
}
