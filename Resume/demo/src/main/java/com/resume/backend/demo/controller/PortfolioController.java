package com.resume.backend.demo.controller;

import com.resume.backend.demo.model.ResumeHistory;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.repository.ResumeHistoryRepository;
import com.resume.backend.demo.service.PortfolioGeneratorService;
import com.resume.backend.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/portfolio")
@RequiredArgsConstructor
@Tag(name = "Portfolio Generator", description = "AI-generated personal portfolio website from resume")
public class PortfolioController {

    private final PortfolioGeneratorService generatorService;
    private final ResumeHistoryRepository historyRepository;
    private final UserService userService;

    // In-memory store for preview HTML (keyed by previewKey)
    private final ConcurrentHashMap<String, String> previewStore = new ConcurrentHashMap<>();

    @PostMapping("/generate")
    @Operation(summary = "Generate a portfolio website from the user's resume",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> generate(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        String theme = (String) body.getOrDefault("theme", "MINIMAL");

        // Resolve resume: explicit resumeId or latest saved
        String resumeJson = resolveResume(body, user);
        if (resumeJson.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "No resume found. Save a resume first or provide resumeId."));
        }

        PortfolioGeneratorService.PortfolioResult result =
                generatorService.generate(resumeJson, theme, user.getId());

        // Cache the HTML for preview
        previewStore.put(result.previewKey(), result.html());

        return ResponseEntity.ok(Map.of(
                "previewKey",  result.previewKey(),
                "theme",       theme,
                "previewUrl",  "/api/v1/portfolio/preview/" + result.previewKey(),
                "downloadUrl", "/api/v1/portfolio/download/" + result.previewKey()
        ));
    }

    @GetMapping(value = "/preview/{key}", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Preview the generated portfolio website")
    public ResponseEntity<String> preview(@PathVariable String key) {
        String html = previewStore.get(key);
        if (html == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(html);
    }

    @GetMapping("/download/{key}")
    @Operation(summary = "Download the generated portfolio as a ZIP file")
    public ResponseEntity<byte[]> download(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails) {

        String html = previewStore.get(key);
        if (html == null) return ResponseEntity.notFound().build();

        User user = userService.findByEmail(userDetails.getUsername());
        PortfolioGeneratorService.PortfolioResult result =
                generatorService.generate(html, "MINIMAL", user.getId());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"portfolio.zip\"")
                .body(result.zipBytes());
    }

    private String resolveResume(Map<String, Object> body, User user) {
        Object idObj = body.get("resumeId");
        if (idObj != null) {
            try {
                Long id = Long.parseLong(idObj.toString());
                return historyRepository.findByIdAndUser(id, user)
                        .map(ResumeHistory::getResumeData).orElse("");
            } catch (Exception ignored) {}
        }
        return historyRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .findFirst().map(ResumeHistory::getResumeData).orElse("");
    }
}
