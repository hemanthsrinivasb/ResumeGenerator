package com.resume.backend.demo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CareerTwinService {

    private final ChatClient.Builder chatClientBuilder;

    private String ai(String prompt) {
        try {
            String raw = chatClientBuilder.build()
                    .prompt().user(prompt).call().content();
            return raw == null ? "" : raw.trim();
        } catch (Exception e) {
            log.error("AI call failed in CareerTwin: {}", e.getMessage());
            return "";
        }
    }

    private String extract(String text, String key) {
        if (text == null) return "N/A";
        for (String line : text.split("\n")) {
            if (line.toUpperCase().startsWith(key.toUpperCase())) {
                int idx = line.indexOf(':');
                return idx >= 0 ? line.substring(idx + 1).trim() : line;
            }
        }
        return "N/A";
    }

    private List<String> extractList(String text, String key) {
        String val = extract(text, key);
        if ("N/A".equals(val)) return List.of();
        return Arrays.stream(val.split("[,;]")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public Map<String, Object> simulateHiring(String resumeJson, String targetRole, String targetCompany) {
        String context = resumeJson != null && !resumeJson.isBlank()
                ? "Candidate resume JSON:\n" + resumeJson + "\n\n"
                : "";

        String raw = ai(context +
                "You are a senior hiring manager at " + targetCompany + " hiring for " + targetRole + ". " +
                "Review this candidate's profile and provide a structured assessment. " +
                "Return EXACTLY these key:value lines (one per line, no extra text):\n" +
                "SHORTLIST_PROBABILITY: (0-100 integer)\n" +
                "MARKET_READINESS: (0-100 integer)\n" +
                "TOP_STRENGTHS: (comma-separated, max 3)\n" +
                "CRITICAL_GAPS: (comma-separated, max 3)\n" +
                "SALARY_RANGE_ESTIMATE: (e.g. $120,000 - $160,000 USD annually)\n" +
                "HIRING_DECISION: (STRONG_YES / YES / MAYBE / NO)\n" +
                "DECISION_REASON: (one concise sentence)\n" +
                "IMPROVEMENT_PRIORITY: (one most impactful thing to fix)\n");

        int shortlistProbability = parseIntSafe(extract(raw, "SHORTLIST_PROBABILITY"), 50);
        int marketReadiness      = parseIntSafe(extract(raw, "MARKET_READINESS"), 50);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shortlistProbability",  shortlistProbability);
        result.put("marketReadiness",        marketReadiness);
        result.put("strengths",              extractList(raw, "TOP_STRENGTHS"));
        result.put("gaps",                   extractList(raw, "CRITICAL_GAPS"));
        result.put("salaryRange",            extract(raw, "SALARY_RANGE_ESTIMATE"));
        result.put("hiringDecision",         extract(raw, "HIRING_DECISION"));
        result.put("decisionReason",         extract(raw, "DECISION_REASON"));
        result.put("improvementPriority",    extract(raw, "IMPROVEMENT_PRIORITY"));
        result.put("targetRole",             targetRole);
        result.put("targetCompany",          targetCompany);
        return result;
    }

    public Map<String, Object> predictCareerTrajectory(String resumeJson) {
        String context = resumeJson != null && !resumeJson.isBlank()
                ? "Candidate resume JSON:\n" + resumeJson + "\n\n"
                : "";

        String raw = ai(context +
                "You are an expert career strategist. Based on this candidate's background, " +
                "predict their realistic career trajectory. " +
                "Return EXACTLY these key:value lines:\n" +
                "YEAR_1_ROLE: (likely role title in 1 year)\n" +
                "YEAR_1_SALARY: (estimated salary range)\n" +
                "YEAR_1_SKILLS: (2-3 key skills to develop, comma-separated)\n" +
                "YEAR_3_ROLE: (likely role in 3 years)\n" +
                "YEAR_3_SALARY: (estimated salary range)\n" +
                "YEAR_3_SKILLS: (2-3 skills needed, comma-separated)\n" +
                "YEAR_5_ROLE: (likely role in 5 years)\n" +
                "YEAR_5_SALARY: (estimated salary range)\n" +
                "YEAR_5_SKILLS: (2-3 skills needed, comma-separated)\n" +
                "CAREER_PEAK: (most likely career peak in 10 years)\n" +
                "BIGGEST_OPPORTUNITY: (single biggest opportunity to accelerate trajectory)\n");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("year1", Map.of(
                "role",   extract(raw, "YEAR_1_ROLE"),
                "salary", extract(raw, "YEAR_1_SALARY"),
                "skills", extractList(raw, "YEAR_1_SKILLS")
        ));
        result.put("year3", Map.of(
                "role",   extract(raw, "YEAR_3_ROLE"),
                "salary", extract(raw, "YEAR_3_SALARY"),
                "skills", extractList(raw, "YEAR_3_SKILLS")
        ));
        result.put("year5", Map.of(
                "role",   extract(raw, "YEAR_5_ROLE"),
                "salary", extract(raw, "YEAR_5_SALARY"),
                "skills", extractList(raw, "YEAR_5_SKILLS")
        ));
        result.put("careerPeak",          extract(raw, "CAREER_PEAK"));
        result.put("biggestOpportunity",  extract(raw, "BIGGEST_OPPORTUNITY"));
        return result;
    }

    private int parseIntSafe(String s, int fallback) {
        try { return Integer.parseInt(s.replaceAll("[^0-9]", "")); }
        catch (Exception e) { return fallback; }
    }
}
