package com.resume.backend.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Handles resume embedding and semantic retrieval for RAG.
 * Gracefully no-ops when VectorStore is unavailable (H2 local dev mode).
 */
@Service
@Slf4j
public class EmbeddingService {

    @Autowired(required = false)
    private VectorStore vectorStore;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isRagEnabled() {
        return vectorStore != null;
    }

    /** Chunk resume JSON into meaningful sections and embed each into PGVector. */
    public void embedResume(String resumeJson, Long userId) {
        if (!isRagEnabled()) {
            log.debug("RAG disabled — skipping resume embedding for user {}", userId);
            return;
        }
        try {
            deleteUserEmbeddings(userId);
            Map<String, Object> resume = objectMapper.readValue(resumeJson, Map.class);
            List<Document> docs = new ArrayList<>();

            // Personal info + summary
            extractSection(resume, "personalInformation", userId, "personal").ifPresent(docs::add);
            extractSection(resume, "summary", userId, "summary").ifPresent(docs::add);

            // Skills — join list into text
            Object skills = resume.get("skills");
            if (skills instanceof List) {
                String skillText = "Skills: " + String.join(", ", (List<String>) skills);
                docs.add(makeDoc(skillText, userId, "skills"));
            }

            // Experience — one doc per job
            Object exp = resume.get("experience");
            if (exp instanceof List<?> expList) {
                for (int i = 0; i < expList.size(); i++) {
                    String text = flattenMap((Map<?, ?>) expList.get(i));
                    docs.add(makeDoc("Experience " + (i + 1) + ": " + text, userId, "experience"));
                }
            }

            // Education
            Object edu = resume.get("education");
            if (edu instanceof List<?> eduList) {
                for (Object item : eduList) {
                    docs.add(makeDoc("Education: " + flattenMap((Map<?, ?>) item), userId, "education"));
                }
            }

            // Projects
            Object projects = resume.get("projects");
            if (projects instanceof List<?> projList) {
                for (Object item : projList) {
                    docs.add(makeDoc("Project: " + flattenMap((Map<?, ?>) item), userId, "projects"));
                }
            }

            // Certifications
            Object certs = resume.get("certifications");
            if (certs instanceof List<?> certList) {
                for (Object item : certList) {
                    String text = item instanceof Map ? flattenMap((Map<?, ?>) item) : item.toString();
                    docs.add(makeDoc("Certification: " + text, userId, "certifications"));
                }
            }

            // Achievements
            Object achievements = resume.get("achievements");
            if (achievements instanceof List<?> achList) {
                for (Object item : achList) {
                    String text = item instanceof Map ? flattenMap((Map<?, ?>) item) : item.toString();
                    docs.add(makeDoc("Achievement: " + text, userId, "achievements"));
                }
            }

            if (!docs.isEmpty()) {
                vectorStore.add(docs);
                log.info("Embedded {} resume chunks for user {}", docs.size(), userId);
            }
        } catch (Exception e) {
            log.warn("Failed to embed resume for user {}: {}", userId, e.getMessage());
        }
    }

    /** Delete all embeddings for a user (called before re-embedding on update). */
    public void deleteUserEmbeddings(Long userId) {
        if (!isRagEnabled()) return;
        try {
            vectorStore.delete(List.of("userId == " + userId));
        } catch (Exception e) {
            log.warn("Could not delete old embeddings for user {}: {}", userId, e.getMessage());
        }
    }

    /** Semantic search — returns top-k relevant resume chunks for a query. */
    public String searchRelevantContext(String query, Long userId, int topK) {
        if (!isRagEnabled()) return "";
        try {
            List<Document> results = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(query)
                            .topK(topK)
                            .filterExpression("userId == '" + userId + "'")
                            .build()
            );
            return results.stream()
                    .map(Document::getText)
                    .collect(Collectors.joining("\n---\n"));
        } catch (Exception e) {
            log.warn("Vector search failed: {}", e.getMessage());
            return "";
        }
    }

    // ── helpers ───────────────────────────────────────────────

    private Optional<Document> extractSection(Map<String, Object> resume, String key,
                                              Long userId, String section) {
        Object val = resume.get(key);
        if (val == null) return Optional.empty();
        String text = val instanceof Map ? flattenMap((Map<?, ?>) val) : val.toString();
        if (text.isBlank()) return Optional.empty();
        return Optional.of(makeDoc(section + ": " + text, userId, section));
    }

    private Document makeDoc(String content, Long userId, String section) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("userId", String.valueOf(userId));
        meta.put("section", section);
        return new Document(content, meta);
    }

    private String flattenMap(Map<?, ?> map) {
        return map.entrySet().stream()
                .filter(e -> e.getValue() != null)
                .map(e -> e.getKey() + ": " + e.getValue())
                .collect(Collectors.joining(", "));
    }
}
