package com.resume.backend.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobSearchService {

    private static final String REMOTIVE_API = "https://remotive.com/api/remote-jobs";
    private static final int DEFAULT_LIMIT = 20;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Search remote jobs via Remotive public API (no API key required).
     * @param search  job title or keyword
     * @param limit   max results to return
     */
    public List<Map<String, Object>> searchJobs(String search, int limit) {
        try {
            String url = REMOTIVE_API + "?search=" + encode(search) + "&limit=" + limit;
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode jobs = root.path("jobs");

            List<Map<String, Object>> result = new ArrayList<>();
            int count = 0;
            for (JsonNode job : jobs) {
                if (count++ >= limit) break;
                result.add(Map.of(
                        "id",          job.path("id").asLong(),
                        "title",       job.path("title").asText(""),
                        "company",     job.path("company_name").asText(""),
                        "companyLogo", job.path("company_logo").asText(""),
                        "url",         job.path("url").asText(""),
                        "jobType",     job.path("job_type").asText(""),
                        "salary",      job.path("salary").asText(""),
                        "category",    job.path("category").asText(""),
                        "tags",        extractTags(job),
                        "publishedAt", job.path("publication_date").asText("")
                ));
            }
            return result;
        } catch (Exception e) {
            log.warn("Remotive API error: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Extract top skills from resume JSON and search for matching jobs.
     * @param resumeJson  JSON string of the resume
     */
    public List<Map<String, Object>> recommendJobsForResume(String resumeJson) {
        try {
            Map<String, Object> resume = objectMapper.readValue(resumeJson, Map.class);

            // Extract job title from experience
            String title = extractJobTitle(resume);

            // Build search query from title + top skills
            List<String> skills = extractSkills(resume);
            String query = title.isBlank() ? "software developer" : title;
            if (!skills.isEmpty()) {
                query += " " + String.join(" ", skills.subList(0, Math.min(3, skills.size())));
            }

            List<Map<String, Object>> jobs = searchJobs(query, DEFAULT_LIMIT);

            // Add a basic match score based on skill overlap
            return jobs.stream()
                    .map(job -> addMatchScore(job, skills))
                    .sorted(Comparator.comparingInt(j -> -((int) j.get("matchScore"))))
                    .toList();
        } catch (Exception e) {
            log.warn("Job recommendation error: {}", e.getMessage());
            return List.of();
        }
    }

    // ── helpers ──────────────────────────────────────────────────

    private Map<String, Object> addMatchScore(Map<String, Object> job, List<String> resumeSkills) {
        if (resumeSkills.isEmpty()) {
            Map<String, Object> copy = new HashMap<>(job);
            copy.put("matchScore", 50);
            copy.put("matchReason", "Based on your job title");
            return copy;
        }

        List<String> tags = (List<String>) job.get("tags");
        String title = ((String) job.get("title")).toLowerCase();

        long matches = resumeSkills.stream()
                .map(String::toLowerCase)
                .filter(skill -> tags.stream().anyMatch(t -> t.toLowerCase().contains(skill))
                        || title.contains(skill))
                .count();

        int score = matches == 0 ? 30 : (int) Math.min(95, 40 + (matches * 15));
        String reason = matches == 0
                ? "General match based on your profile"
                : matches + " matching skill" + (matches > 1 ? "s" : "") + " found";

        Map<String, Object> copy = new HashMap<>(job);
        copy.put("matchScore", score);
        copy.put("matchReason", reason);
        return copy;
    }

    @SuppressWarnings("unchecked")
    private List<String> extractSkills(Map<String, Object> resume) {
        Object skills = resume.get("skills");
        if (skills instanceof List<?> list) {
            return list.stream()
                    .map(Object::toString)
                    .filter(s -> !s.isBlank())
                    .toList();
        }
        return List.of();
    }

    private String extractJobTitle(Map<String, Object> resume) {
        Object exp = resume.get("experience");
        if (exp instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof Map<?, ?> m) {
                Object title = m.get("title");
                if (title != null) return title.toString();
            }
        }
        return "";
    }

    private List<String> extractTags(JsonNode job) {
        List<String> tags = new ArrayList<>();
        JsonNode tagsNode = job.path("tags");
        if (tagsNode.isArray()) {
            for (JsonNode tag : tagsNode) tags.add(tag.asText(""));
        }
        return tags;
    }

    private String encode(String s) {
        return s.replace(" ", "+");
    }
}
