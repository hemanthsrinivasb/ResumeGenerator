package com.resume.backend.demo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.repository.ResumeHistoryRepository;
import com.resume.backend.demo.service.JobSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "Job Recommendations", description = "AI-powered job search and resume-matched job recommendations")
public class JobController {

    private final JobSearchService jobSearchService;
    private final ResumeHistoryRepository historyRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Direct keyword/title job search — no auth required. */
    @GetMapping("/search")
    @Operation(summary = "Search remote jobs by title or keyword (Remotive API)")
    public ResponseEntity<List<Map<String, Object>>> searchJobs(
            @RequestParam String query,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(jobSearchService.searchJobs(query, Math.min(limit, 50)));
    }

    /**
     * Recommend jobs matched to user's most recent saved resume.
     * Requires JWT — loads the latest resume from history.
     */
    @GetMapping("/recommend")
    @Operation(summary = "Get AI-matched job recommendations based on your latest resume",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Map<String, Object>>> recommendJobs(
            @AuthenticationPrincipal User user) {

        return historyRepository.findByUserOrderByCreatedAtDesc(
                user)
                .stream()
                .findFirst()
                .map(history -> {
                    try {
                        List<Map<String, Object>> jobs =
                                jobSearchService.recommendJobsForResume(history.getResumeData());
                        return ResponseEntity.ok(jobs);
                    } catch (Exception e) {
                        return ResponseEntity.ok(List.<Map<String, Object>>of());
                    }
                })
                .orElse(ResponseEntity.ok(List.of()));
    }

    /**
     * Recommend jobs for a specific saved resume by ID.
     */
    @GetMapping("/recommend/{resumeId}")
    @Operation(summary = "Get job recommendations for a specific saved resume",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Map<String, Object>>> recommendJobsForResume(
            @PathVariable Long resumeId,
            @AuthenticationPrincipal User user) {

        return historyRepository.findByIdAndUser(resumeId, user)
                .map(history -> {
                    try {
                        return ResponseEntity.ok(
                                jobSearchService.recommendJobsForResume(history.getResumeData()));
                    } catch (Exception e) {
                        return ResponseEntity.ok(List.<Map<String, Object>>of());
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
