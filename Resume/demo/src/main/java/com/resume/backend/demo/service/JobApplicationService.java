package com.resume.backend.demo.service;

import com.resume.backend.demo.model.JobApplication;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.repository.JobApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobApplicationRepository repo;
    private final ChatClient.Builder chatClientBuilder;

    private String ai(String prompt) {
        return chatClientBuilder.build().prompt().user(prompt).call().content();
    }

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public JobApplication saveApplication(User user, String company, String role,
                                          String jobUrl, String jobDescription, String notes) {
        JobApplication app = JobApplication.builder()
                .user(user).company(company).role(role)
                .jobUrl(jobUrl).jobDescription(jobDescription)
                .notes(notes).status(JobApplication.AppStatus.SAVED)
                .build();
        return repo.save(app);
    }

    @Transactional
    public JobApplication updateStatus(Long id, User user, String status) {
        JobApplication app = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(JobApplication.AppStatus.valueOf(status.toUpperCase()));
        if (status.equalsIgnoreCase("APPLIED") && app.getAppliedAt() == null) {
            app.setAppliedAt(LocalDateTime.now());
        }
        return repo.save(app);
    }

    public List<JobApplication> getApplications(User user) {
        return repo.findByUserOrderByCreatedAtDesc(user);
    }

    // ── AI: Tailor Resume ─────────────────────────────────────────────

    @Transactional
    public Map<String, Object> tailorResume(Long id, User user, String baseResumeJson) {
        JobApplication app = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        String jd = app.getJobDescription();
        if (jd == null || jd.isBlank()) {
            return Map.of("error", "No job description saved for this application. Add one first.");
        }

        String prompt = """
                You are an expert resume writer and ATS specialist.

                Job Description:
                %s

                Current Resume (JSON):
                %s

                Rewrite the resume to maximize match for this specific job description.
                - Incorporate keywords from the JD naturally
                - Reframe existing experience to highlight relevance
                - Adjust the summary section to target this exact role
                - Keep all factual information accurate — do not fabricate

                Return the tailored resume as a valid JSON object with the same structure as the input.
                Wrap in ```json ... ``` code block.
                """.formatted(jd, baseResumeJson != null ? baseResumeJson : "{}");

        String result = ai(prompt);
        app.setTailoredResumeJson(result);
        repo.save(app);

        return Map.of("applicationId", id, "tailoredResume", result, "message", "Resume tailored successfully");
    }

    // ── AI: Generate Cover Letter ─────────────────────────────────────

    @Transactional
    public Map<String, Object> generateCoverLetter(Long id, User user, String baseResumeJson) {
        JobApplication app = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        String resumeContext = app.getTailoredResumeJson() != null ? app.getTailoredResumeJson() : baseResumeJson;
        String jd = app.getJobDescription() != null ? app.getJobDescription() : "";

        String prompt = """
                Write a professional, personalized cover letter for:
                Company: %s
                Role: %s

                Job Description:
                %s

                Candidate Resume (JSON):
                %s

                Requirements:
                - 3 paragraphs: opening hook, skills match, closing with enthusiasm
                - Reference specific company name and role
                - Highlight 2–3 concrete achievements from the resume
                - Professional but human tone — not robotic
                - Under 350 words total
                """.formatted(app.getCompany(), app.getRole(), jd, resumeContext != null ? resumeContext : "{}");

        String letter = ai(prompt);
        app.setCoverLetter(letter);
        repo.save(app);

        return Map.of("applicationId", id, "coverLetter", letter);
    }

    // ── AI: Analyze Rejection ─────────────────────────────────────────

    public Map<String, Object> analyzeRejection(Long id, User user, String baseResumeJson) {
        JobApplication app = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        String resumeUsed = app.getTailoredResumeJson() != null ? app.getTailoredResumeJson() : baseResumeJson;
        String jd = app.getJobDescription() != null ? app.getJobDescription() : "";

        String prompt = """
                Analyze a likely job application rejection.

                Job: %s at %s
                Job Description: %s
                Submitted Resume: %s

                Provide:
                LIKELY_REASONS: 3 bullet points explaining why the application likely did not advance
                SKILL_GAPS: specific skills/keywords in the JD missing from the resume
                RESUME_IMPROVEMENTS: 3 concrete changes to make before the next application
                REAPPLY_TIMELINE: when it makes sense to reapply (if ever) and what needs to change

                Be honest and specific. Format as a structured analysis.
                """.formatted(app.getRole(), app.getCompany(), jd, resumeUsed != null ? resumeUsed : "{}");

        String analysis = ai(prompt);
        return Map.of("applicationId", id, "analysis", analysis, "company", app.getCompany(), "role", app.getRole());
    }

    // ── Kanban Board ──────────────────────────────────────────────────

    public Map<String, Object> getKanbanBoard(User user) {
        List<JobApplication> all = repo.findByUserOrderByCreatedAtDesc(user);

        Map<String, List<Map<String, Object>>> board = Arrays.stream(JobApplication.AppStatus.values())
                .collect(Collectors.toMap(
                        Enum::name,
                        status -> all.stream()
                                .filter(a -> a.getStatus() == status)
                                .map(this::toCard)
                                .collect(Collectors.toList()),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        return Map.of("board", board, "total", all.size());
    }

    private Map<String, Object> toCard(JobApplication a) {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("id",               a.getId());
        card.put("company",          a.getCompany());
        card.put("role",             a.getRole());
        card.put("jobUrl",           a.getJobUrl() != null ? a.getJobUrl() : "");
        card.put("status",           a.getStatus().name());
        card.put("appliedAt",        a.getAppliedAt() != null ? a.getAppliedAt().toString() : "");
        card.put("createdAt",        a.getCreatedAt().toString());
        card.put("notes",            a.getNotes() != null ? a.getNotes() : "");
        card.put("hasTailored",      a.getTailoredResumeJson() != null);
        card.put("hasCoverLetter",   a.getCoverLetter() != null);
        card.put("hasJobDescription",a.getJobDescription() != null && !a.getJobDescription().isBlank());
        return card;
    }
}
