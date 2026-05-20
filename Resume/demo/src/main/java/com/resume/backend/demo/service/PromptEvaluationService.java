package com.resume.backend.demo.service;

import com.resume.backend.demo.model.PromptFeedback;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.repository.PromptFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromptEvaluationService {

    private final PromptFeedbackRepository repo;
    private final ChatClient.Builder chatClientBuilder;

    private String ai(String prompt) {
        return chatClientBuilder.build().prompt().user(prompt).call().content();
    }

    // ── Submit feedback ───────────────────────────────────────────────

    public PromptFeedback submitFeedback(User user, String endpointType, int rating,
                                         String feedbackText, String responseSnippet) {
        String snippet = responseSnippet != null && responseSnippet.length() > 500
                ? responseSnippet.substring(0, 500) : responseSnippet;

        PromptFeedback fb = PromptFeedback.builder()
                .user(user)
                .endpointType(endpointType.toUpperCase())
                .rating(Math.max(1, Math.min(5, rating)))
                .feedbackText(feedbackText)
                .aiResponseSnippet(snippet)
                .build();
        return repo.save(fb);
    }

    // ── Endpoint quality report ───────────────────────────────────────

    public Map<String, Object> analyzeEndpointQuality(String endpointType) {
        List<PromptFeedback> recent = repo.findTop20ByEndpointTypeOrderByCreatedAtDesc(endpointType.toUpperCase());
        Double avgRating = repo.averageRatingByEndpointType(endpointType.toUpperCase());

        if (recent.isEmpty()) {
            return Map.of("endpointType", endpointType, "avgRating", 0, "message", "No feedback collected yet");
        }

        String feedbackSummary = recent.stream()
                .filter(f -> f.getFeedbackText() != null && !f.getFeedbackText().isBlank())
                .map(f -> "Rating " + f.getRating() + "/5: " + f.getFeedbackText())
                .collect(Collectors.joining("\n"));

        String snippetSummary = recent.stream()
                .filter(f -> f.getAiResponseSnippet() != null)
                .limit(5)
                .map(PromptFeedback::getAiResponseSnippet)
                .collect(Collectors.joining("\n---\n"));

        String prompt = """
                Analyze user feedback for AI endpoint: %s
                Average rating: %.1f/5.0
                Total responses: %d

                User feedback comments:
                %s

                Sample AI responses that received feedback:
                %s

                Provide:
                COMMON_PRAISE: What users liked most (2-3 bullet points)
                COMMON_COMPLAINTS: What users disliked or found lacking (2-3 bullet points)
                PROMPT_IMPROVEMENTS: Specific suggestions to improve the AI prompt for this endpoint (2-3 actionable items)
                QUALITY_ASSESSMENT: One sentence overall quality assessment
                """.formatted(endpointType, avgRating != null ? avgRating : 0.0,
                recent.size(), feedbackSummary, snippetSummary);

        String analysis = ai(prompt);

        return Map.of(
                "endpointType",   endpointType,
                "avgRating",      avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0,
                "totalFeedbacks", recent.size(),
                "analysis",       analysis
        );
    }

    // ── System health report ──────────────────────────────────────────

    public Map<String, Object> getSystemHealthReport() {
        List<Object[]> aggregated = repo.aggregateByEndpoint();

        List<Map<String, Object>> endpointStats = aggregated.stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("endpointType", row[0]);
            m.put("avgRating",    row[1] != null ? Math.round(((Number) row[1]).doubleValue() * 10.0) / 10.0 : 0.0);
            m.put("count",        row[2]);
            return m;
        }).toList();

        double overallAvg = endpointStats.stream()
                .mapToDouble(m -> ((Number) m.get("avgRating")).doubleValue())
                .average().orElse(0);

        String healthBadge = overallAvg >= 4.0 ? "EXCELLENT" : overallAvg >= 3.0 ? "GOOD" : overallAvg >= 2.0 ? "FAIR" : "NEEDS_IMPROVEMENT";

        return Map.of(
                "overallAvgRating", Math.round(overallAvg * 10.0) / 10.0,
                "healthBadge",      healthBadge,
                "endpoints",        endpointStats,
                "totalFeedbacks",   endpointStats.stream().mapToLong(m -> ((Number) m.get("count")).longValue()).sum()
        );
    }
}
