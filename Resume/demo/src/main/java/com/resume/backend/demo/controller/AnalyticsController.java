package com.resume.backend.demo.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.backend.demo.model.InterviewSession;
import com.resume.backend.demo.model.ResumeHistory;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.repository.InterviewSessionRepository;
import com.resume.backend.demo.repository.ResumeHistoryRepository;
import com.resume.backend.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Career Analytics", description = "Resume evolution, skill trends, and career insights")
public class AnalyticsController {

    private final ResumeHistoryRepository historyRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/resume-evolution")
    @Operation(summary = "Resume evolution over time — word count and skill count per save",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Map<String, Object>>> getResumeEvolution(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        List<ResumeHistory> resumes = historyRepository.findByUserOrderByCreatedAtDesc(user);

        // Reverse so oldest is first for timeline
        List<ResumeHistory> chronological = new ArrayList<>(resumes);
        Collections.reverse(chronological);

        List<Map<String, Object>> result = chronological.stream()
                .map(h -> {
                    int skillCount = 0;
                    int wordCount  = 0;
                    try {
                        JsonNode root = objectMapper.readTree(h.getResumeData());
                        wordCount = countWords(h.getResumeData());
                        JsonNode skillsNode = root.get("skills");
                        if (skillsNode != null && skillsNode.isArray()) {
                            skillCount = skillsNode.size();
                        }
                    } catch (Exception e) {
                        log.debug("Could not parse resume {}: {}", h.getId(), e.getMessage());
                    }
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("id",         h.getId());
                    entry.put("title",      h.getTitle());
                    entry.put("date",       h.getCreatedAt().toString());
                    entry.put("skillCount", skillCount);
                    entry.put("wordCount",  wordCount);
                    return entry;
                })
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/skill-heatmap")
    @Operation(summary = "Skill frequency heatmap across all saved resumes",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Map<String, Object>>> getSkillHeatmap(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        List<ResumeHistory> resumes = historyRepository.findByUserOrderByCreatedAtDesc(user);

        Map<String, Integer> freq = new LinkedHashMap<>();
        for (ResumeHistory h : resumes) {
            try {
                JsonNode root = objectMapper.readTree(h.getResumeData());
                JsonNode skillsNode = root.get("skills");
                if (skillsNode != null && skillsNode.isArray()) {
                    for (JsonNode s : skillsNode) {
                        String skill = s.asText().trim();
                        if (!skill.isEmpty()) {
                            freq.merge(skill, 1, Integer::sum);
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Skill parse error for resume {}: {}", h.getId(), e.getMessage());
            }
        }

        List<Map<String, Object>> result = freq.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(e -> Map.<String, Object>of("skill", e.getKey(), "count", e.getValue()))
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/career-summary")
    @Operation(summary = "Aggregated career stats — total resumes, top skill, latest activity",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> getCareerSummary(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        List<ResumeHistory> resumes = historyRepository.findByUserOrderByCreatedAtDesc(user);

        int totalResumes = resumes.size();
        String latestDate = resumes.isEmpty() ? null : resumes.get(0).getCreatedAt().toString();

        // Collect all skills across all resumes to find the top one
        Map<String, Integer> freq = new HashMap<>();
        int totalSkills = 0;
        for (ResumeHistory h : resumes) {
            try {
                JsonNode root = objectMapper.readTree(h.getResumeData());
                JsonNode skillsNode = root.get("skills");
                if (skillsNode != null && skillsNode.isArray()) {
                    for (JsonNode s : skillsNode) {
                        String skill = s.asText().trim();
                        if (!skill.isEmpty()) {
                            freq.merge(skill, 1, Integer::sum);
                            totalSkills++;
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        String topSkill = freq.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");

        int uniqueSkillCount = freq.size();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalResumes",     totalResumes);
        summary.put("latestActivity",   latestDate);
        summary.put("topSkill",         topSkill);
        summary.put("uniqueSkillCount", uniqueSkillCount);
        summary.put("totalSkillMentions", totalSkills);

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/interview-progress")
    @Operation(summary = "Mock interview progress over time",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Map<String, Object>>> getInterviewProgress(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        List<Map<String, Object>> result = interviewSessionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .filter(s -> s.getStatus() == InterviewSession.SessionStatus.COMPLETED && s.getOverallScore() != null)
                .map(s -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("jobTitle",      s.getJobTitle());
                    entry.put("interviewType", s.getInterviewType().name());
                    entry.put("overallScore",  s.getOverallScore());
                    entry.put("date",          s.getCreatedAt().toString());
                    return entry;
                })
                .toList();

        return ResponseEntity.ok(result);
    }

    // ── helpers ────────────────────────────────────────────────────────

    private int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        // Strip JSON structure characters for a rough word count
        String stripped = text.replaceAll("[{}\\[\\]\":,]", " ").trim();
        return stripped.isBlank() ? 0 : stripped.split("\\s+").length;
    }
}
