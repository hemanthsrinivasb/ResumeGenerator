package com.resume.backend.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketIntelligenceService {

    private static final String REMOTIVE_API = "https://remotive.com/api/remote-jobs";
    private final RestTemplate restTemplate;
    private final ChatClient.Builder chatClientBuilder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String ai(String prompt) {
        return chatClientBuilder.build().prompt().user(prompt).call().content();
    }

    // ── Skill Demand ──────────────────────────────────────────────────

    public Map<String, Object> getSkillDemand(String role) {
        List<String> descriptions = fetchJobDescriptions(role, 40);

        if (descriptions.isEmpty()) {
            return Map.of("error", "No jobs found for role: " + role, "skills", List.of());
        }

        String combinedText = String.join("\n\n---\n\n",
                descriptions.subList(0, Math.min(descriptions.size(), 20)));

        String prompt = """
                Analyze these remote job descriptions for the role "%s" and identify the most in-demand skills.

                Job Descriptions:
                %s

                Return a JSON array of the top 15 skills, each with:
                - skill: skill name
                - frequency: estimated frequency score 1-100 based on how often it appears
                - trend: "growing", "stable", or "declining"
                - category: "technical", "soft", or "tool"

                Return ONLY the JSON array, no markdown wrapping.
                """.formatted(role, combinedText);

        String raw = ai(prompt);
        List<Object> skills = parseJsonArray(raw);

        return Map.of(
                "role",    role,
                "skills",  skills,
                "jobsAnalyzed", descriptions.size()
        );
    }

    // ── Salary Insights ───────────────────────────────────────────────

    public Map<String, Object> getSalaryInsights(String role, String location) {
        String loc = location != null && !location.isBlank() ? location : "global remote";

        String prompt = """
                Provide realistic salary range estimates for the role "%s" in "%s" (remote).

                Return key:value pairs in this exact format (one per line, no extra text):
                JUNIOR_MIN: [amount in USD/year]
                JUNIOR_MAX: [amount in USD/year]
                MID_MIN: [amount in USD/year]
                MID_MAX: [amount in USD/year]
                SENIOR_MIN: [amount in USD/year]
                SENIOR_MAX: [amount in USD/year]
                ANNUAL_GROWTH_RATE: [percentage like 8%]
                DEMAND_LEVEL: [High/Medium/Low]
                MARKET_OUTLOOK: [one sentence about the job market for this role]
                TOP_PAYING_COMPANIES: [comma-separated list of 3 companies known to pay well]
                """.formatted(role, loc);

        String raw = ai(prompt);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("role", role);
        result.put("location", loc);
        result.put("juniorRange", Map.of(
                "min", extractLine(raw, "JUNIOR_MIN"),
                "max", extractLine(raw, "JUNIOR_MAX")));
        result.put("midRange", Map.of(
                "min", extractLine(raw, "MID_MIN"),
                "max", extractLine(raw, "MID_MAX")));
        result.put("seniorRange", Map.of(
                "min", extractLine(raw, "SENIOR_MIN"),
                "max", extractLine(raw, "SENIOR_MAX")));
        result.put("annualGrowthRate",  extractLine(raw, "ANNUAL_GROWTH_RATE"));
        result.put("demandLevel",       extractLine(raw, "DEMAND_LEVEL"));
        result.put("marketOutlook",     extractLine(raw, "MARKET_OUTLOOK"));
        result.put("topPayingCompanies",extractLine(raw, "TOP_PAYING_COMPANIES"));
        return result;
    }

    // ── Hiring Trends ─────────────────────────────────────────────────

    public Map<String, Object> getHiringTrends() {
        List<String> descriptions = fetchJobDescriptions("", 60);
        String combined = String.join("\n", descriptions.subList(0, Math.min(descriptions.size(), 30)));

        String prompt = """
                Analyze these recent remote job postings and identify macro hiring trends.

                Job Postings Summary:
                %s

                Return key:value pairs (one per line):
                GROWING_ROLES: [comma-separated top 5 roles showing growth in demand]
                DECLINING_ROLES: [comma-separated top 3 roles losing demand]
                EMERGING_TECHNOLOGIES: [comma-separated top 5 technologies appearing frequently]
                REMOTE_RATIO: [estimated % of jobs that are fully remote]
                HOT_INDUSTRIES: [comma-separated top 3 industries hiring most]
                AI_IMPACT: [one sentence on how AI is affecting job postings]
                HIRING_OUTLOOK: [one sentence on overall market sentiment]
                """.formatted(combined);

        String raw = ai(prompt);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("growingRoles",         splitCsv(extractLine(raw, "GROWING_ROLES")));
        result.put("decliningRoles",        splitCsv(extractLine(raw, "DECLINING_ROLES")));
        result.put("emergingTechnologies",  splitCsv(extractLine(raw, "EMERGING_TECHNOLOGIES")));
        result.put("remoteRatio",           extractLine(raw, "REMOTE_RATIO"));
        result.put("hotIndustries",         splitCsv(extractLine(raw, "HOT_INDUSTRIES")));
        result.put("aiImpact",              extractLine(raw, "AI_IMPACT"));
        result.put("hiringOutlook",         extractLine(raw, "HIRING_OUTLOOK"));
        result.put("jobsAnalyzed",          descriptions.size());
        return result;
    }

    // ── Private helpers ───────────────────────────────────────────────

    private List<String> fetchJobDescriptions(String search, int limit) {
        try {
            String url = REMOTIVE_API + (search.isBlank() ? "" : "?search=" + encode(search));
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode jobs = root.path("jobs");

            List<String> descriptions = new ArrayList<>();
            int count = 0;
            for (JsonNode job : jobs) {
                if (count++ >= limit) break;
                String title = job.path("title").asText("");
                String company = job.path("company_name").asText("");
                String desc = job.path("description").asText("").replaceAll("<[^>]+>", "");
                if (desc.length() > 800) desc = desc.substring(0, 800);
                descriptions.add(title + " at " + company + ":\n" + desc);
            }
            return descriptions;
        } catch (Exception e) {
            log.warn("Remotive API error: {}", e.getMessage());
            return List.of();
        }
    }

    private String extractLine(String text, String key) {
        if (text == null) return "";
        for (String line : text.split("\n")) {
            if (line.trim().startsWith(key + ":")) {
                return line.substring(line.indexOf(':') + 1).trim();
            }
        }
        return "";
    }

    private List<String> splitCsv(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isBlank()).toList();
    }

    @SuppressWarnings("unchecked")
    private List<Object> parseJsonArray(String raw) {
        try {
            String cleaned = raw.replaceAll("(?s)```json|```", "").trim();
            int start = cleaned.indexOf('[');
            int end   = cleaned.lastIndexOf(']');
            if (start != -1 && end != -1) {
                return objectMapper.readValue(cleaned.substring(start, end + 1), List.class);
            }
        } catch (Exception e) {
            log.warn("Could not parse skills JSON: {}", e.getMessage());
        }
        return List.of();
    }

    private String encode(String s) {
        return s.replace(" ", "%20");
    }
}
