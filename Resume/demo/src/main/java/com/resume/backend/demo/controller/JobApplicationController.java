package com.resume.backend.demo.controller;

import com.resume.backend.demo.model.User;
import com.resume.backend.demo.service.JobApplicationService;
import com.resume.backend.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/job-applications")
@RequiredArgsConstructor
@Tag(name = "Job Application Tracker", description = "AI-powered job application lifecycle management")
public class JobApplicationController {

    private final JobApplicationService service;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Save a new job application", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> create(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user = userService.findByEmail(ud.getUsername());
        var app = service.saveApplication(user,
                body.getOrDefault("company", ""),
                body.getOrDefault("role", ""),
                body.get("jobUrl"),
                body.get("jobDescription"),
                body.get("notes"));
        return ResponseEntity.status(HttpStatus.CREATED).body(app.getId());
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update application status", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user = userService.findByEmail(ud.getUsername());
        String status = body.getOrDefault("status", "SAVED");
        return ResponseEntity.ok(service.updateStatus(id, user, status));
    }

    @PostMapping("/{id}/tailor")
    @Operation(summary = "AI-tailor resume to match job description", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> tailorResume(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user = userService.findByEmail(ud.getUsername());
        return ResponseEntity.ok(service.tailorResume(id, user, body.get("baseResumeJson")));
    }

    @PostMapping("/{id}/cover-letter")
    @Operation(summary = "AI-generate a cover letter for this application", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> coverLetter(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user = userService.findByEmail(ud.getUsername());
        return ResponseEntity.ok(service.generateCoverLetter(id, user, body.get("baseResumeJson")));
    }

    @PostMapping("/{id}/analyze-rejection")
    @Operation(summary = "AI rejection analysis with improvement recommendations", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> analyzeRejection(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user = userService.findByEmail(ud.getUsername());
        return ResponseEntity.ok(service.analyzeRejection(id, user, body.get("baseResumeJson")));
    }

    @GetMapping("/board")
    @Operation(summary = "Kanban board: applications grouped by status", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> board(@AuthenticationPrincipal UserDetails ud) {
        User user = userService.findByEmail(ud.getUsername());
        return ResponseEntity.ok(service.getKanbanBoard(user));
    }

    @GetMapping
    @Operation(summary = "List all applications (flat list)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> list(@AuthenticationPrincipal UserDetails ud) {
        User user = userService.findByEmail(ud.getUsername());
        return ResponseEntity.ok(service.getApplications(user));
    }
}
