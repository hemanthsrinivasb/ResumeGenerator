package com.resume.backend.demo.service;

import com.resume.backend.demo.model.User;
import com.resume.backend.demo.model.WorkflowSession;
import com.resume.backend.demo.repository.WorkflowSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowSessionRepository workflowRepository;
    private final ChatClient.Builder chatClientBuilder;

    private String ai(String prompt) {
        try {
            String raw = chatClientBuilder.build()
                    .prompt().user(prompt).call().content();
            return raw == null ? "" : raw.trim();
        } catch (Exception e) {
            log.error("AI call failed: {}", e.getMessage());
            return "AI processing error. Please try again.";
        }
    }

    public Map<String, Object> createWorkflow(User user, String goalText, String resumeJson) {
        String resumeContext = (resumeJson != null && !resumeJson.isBlank())
                ? "User's current resume JSON:\n" + resumeJson + "\n\n"
                : "";

        // Step 1 — Gap Analysis
        String gapAnalysis = ai(resumeContext +
                "The user's career goal: \"" + goalText + "\"\n\n" +
                "You are a senior career strategist. Identify exactly 5 specific skill or experience gaps " +
                "that stand between this user and their goal. For each gap: give a clear gap title, " +
                "why it matters, and the estimated time to close it. Be specific and actionable. " +
                "Format as a numbered list.");

        // Step 2 — Learning Roadmap
        String learningRoadmap = ai(
                "Career goal: \"" + goalText + "\"\n" +
                "Identified gaps:\n" + gapAnalysis + "\n\n" +
                "Create a detailed week-by-week learning roadmap to close these gaps over 6 months. " +
                "Include free and paid resources (Coursera, YouTube, LeetCode, books). " +
                "Group by month (Month 1-6), with weekly milestones. Be very specific about what to learn each week.");

        // Step 3 — Resume Rewrite
        String rewrittenResume = ai(resumeContext +
                "Career goal: \"" + goalText + "\"\n\n" +
                "Rewrite and enhance this resume to position the user for their target role. " +
                "Strengthen the summary, reframe experience bullets using STAR format with metrics, " +
                "and highlight transferable skills most relevant to the goal. " +
                "Return the improved resume in clean, ATS-optimized plain text format.");

        // Step 4 — Interview Prep
        String interviewPrep = ai(
                "Target role from goal: \"" + goalText + "\"\n\n" +
                "Create a comprehensive interview preparation guide. Include: " +
                "1) Top 10 interview topics for this role with 3 questions per topic, " +
                "2) 5 behavioral questions using STAR format with example answers, " +
                "3) 3 system design topics if technical role, " +
                "4) Salary negotiation talking points. " +
                "Be specific and detailed.");

        // Step 5 — Master Timeline
        String masterTimeline = ai(
                "Career goal: \"" + goalText + "\"\n" +
                "Gap analysis summary:\n" + gapAnalysis.substring(0, Math.min(500, gapAnalysis.length())) + "\n\n" +
                "Create a master 6-month action timeline combining learning, portfolio building, " +
                "networking, job applications, and interview prep. " +
                "Format as Month 1 through Month 6, each with 4-5 concrete weekly actions. " +
                "Include specific milestones (e.g., 'Complete AWS cert', 'Apply to 5 target companies').");

        WorkflowSession session = WorkflowSession.builder()
                .user(user)
                .goalText(goalText)
                .gapAnalysis(gapAnalysis)
                .learningRoadmap(learningRoadmap)
                .rewrittenResume(rewrittenResume)
                .interviewPrep(interviewPrep)
                .masterTimeline(masterTimeline)
                .build();
        workflowRepository.save(session);

        return Map.of(
                "sessionId",       session.getId(),
                "goalText",        goalText,
                "gapAnalysis",     gapAnalysis,
                "learningRoadmap", learningRoadmap,
                "rewrittenResume", rewrittenResume,
                "interviewPrep",   interviewPrep,
                "masterTimeline",  masterTimeline
        );
    }

    public List<WorkflowSession> getUserSessions(User user) {
        return workflowRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Map<String, Object> getSessionDetail(Long id, User user) {
        WorkflowSession session = workflowRepository.findById(id)
                .filter(s -> s.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return Map.of(
                "sessionId",       session.getId(),
                "goalText",        session.getGoalText(),
                "gapAnalysis",     orEmpty(session.getGapAnalysis()),
                "learningRoadmap", orEmpty(session.getLearningRoadmap()),
                "rewrittenResume", orEmpty(session.getRewrittenResume()),
                "interviewPrep",   orEmpty(session.getInterviewPrep()),
                "masterTimeline",  orEmpty(session.getMasterTimeline()),
                "createdAt",       session.getCreatedAt().toString()
        );
    }

    private String orEmpty(String s) { return s == null ? "" : s; }
}
