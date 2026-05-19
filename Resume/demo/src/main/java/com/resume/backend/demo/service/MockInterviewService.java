package com.resume.backend.demo.service;

import com.resume.backend.demo.model.*;
import com.resume.backend.demo.repository.InterviewQuestionRepository;
import com.resume.backend.demo.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockInterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final ChatClient.Builder chatClientBuilder;

    private ChatClient chatClient() { return chatClientBuilder.build(); }

    // ── Start a new session ────────────────────────────────────────────

    @Transactional
    public Map<String, Object> startSession(User user, String jobTitle, String interviewType) {
        InterviewSession.InterviewType type = InterviewSession.InterviewType.valueOf(interviewType.toUpperCase());

        InterviewSession session = InterviewSession.builder()
                .user(user)
                .jobTitle(jobTitle)
                .interviewType(type)
                .totalQuestions(7)
                .build();
        sessionRepository.save(session);

        InterviewQuestion firstQuestion = generateNextQuestion(session, 1);
        questionRepository.save(firstQuestion);

        return Map.of(
                "sessionId",       session.getId(),
                "jobTitle",        jobTitle,
                "interviewType",   type.name(),
                "totalQuestions",  session.getTotalQuestions(),
                "question",        Map.of(
                        "id",             firstQuestion.getId(),
                        "text",           firstQuestion.getQuestionText(),
                        "category",       firstQuestion.getCategory(),
                        "sequenceNumber", firstQuestion.getSequenceNumber()
                )
        );
    }

    // ── Submit an answer, get evaluation + next question ───────────────

    @Transactional
    public Map<String, Object> submitAnswer(Long sessionId, User user, String answer) {
        InterviewSession session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() == InterviewSession.SessionStatus.COMPLETED) {
            throw new RuntimeException("Session already completed");
        }

        // Find the last unanswered question
        List<InterviewQuestion> questions = questionRepository.findBySessionOrderBySequenceNumberAsc(session);
        InterviewQuestion current = questions.stream()
                .filter(q -> q.getUserAnswer() == null)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No pending question found"));

        // Evaluate the answer
        String evaluation = evaluateAnswer(current.getQuestionText(), answer, session.getJobTitle(), session.getInterviewType().name());
        int score = extractScore(evaluation);

        current.setUserAnswer(answer);
        current.setAiEvaluation(evaluation);
        current.setScore(score);
        questionRepository.save(current);

        int answered = session.getQuestionsAnswered() + 1;
        session.setQuestionsAnswered(answered);
        sessionRepository.save(session);

        boolean sessionComplete = answered >= session.getTotalQuestions();

        if (sessionComplete) {
            return endSession(session, questions);
        }

        // Generate next question
        InterviewQuestion next = generateNextQuestion(session, answered + 1);
        questionRepository.save(next);

        return Map.of(
                "sessionComplete",  false,
                "questionsAnswered", answered,
                "totalQuestions",   session.getTotalQuestions(),
                "evaluation", Map.of(
                        "score",      score,
                        "feedback",   evaluation,
                        "questionId", current.getId()
                ),
                "nextQuestion", Map.of(
                        "id",             next.getId(),
                        "text",           next.getQuestionText(),
                        "category",       next.getCategory(),
                        "sequenceNumber", next.getSequenceNumber()
                )
        );
    }

    // ── End session early ──────────────────────────────────────────────

    @Transactional
    public Map<String, Object> finishSession(Long sessionId, User user) {
        InterviewSession session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        List<InterviewQuestion> questions = questionRepository.findBySessionOrderBySequenceNumberAsc(session);
        return endSession(session, questions);
    }

    // ── List user sessions ─────────────────────────────────────────────

    public List<Map<String, Object>> getUserSessions(User user) {
        return sessionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(s -> Map.<String, Object>of(
                        "id",              s.getId(),
                        "jobTitle",        s.getJobTitle(),
                        "interviewType",   s.getInterviewType().name(),
                        "status",          s.getStatus().name(),
                        "overallScore",    s.getOverallScore() != null ? s.getOverallScore() : 0.0,
                        "questionsAnswered", s.getQuestionsAnswered(),
                        "createdAt",       s.getCreatedAt().toString()
                ))
                .toList();
    }

    // ── Get full session transcript ────────────────────────────────────

    public Map<String, Object> getSessionDetail(Long sessionId, User user) {
        InterviewSession session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        List<InterviewQuestion> questions = questionRepository.findBySessionOrderBySequenceNumberAsc(session);

        List<Map<String, Object>> qList = questions.stream()
                .map(q -> Map.<String, Object>of(
                        "id",           q.getId(),
                        "question",     q.getQuestionText(),
                        "category",     q.getCategory(),
                        "answer",       q.getUserAnswer() != null ? q.getUserAnswer() : "",
                        "evaluation",   q.getAiEvaluation() != null ? q.getAiEvaluation() : "",
                        "score",        q.getScore() != null ? q.getScore() : 0
                ))
                .toList();

        return Map.of(
                "id",              session.getId(),
                "jobTitle",        session.getJobTitle(),
                "interviewType",   session.getInterviewType().name(),
                "status",          session.getStatus().name(),
                "overallScore",    session.getOverallScore() != null ? session.getOverallScore() : 0.0,
                "feedback",        session.getFeedback() != null ? session.getFeedback() : "",
                "questions",       qList,
                "createdAt",       session.getCreatedAt().toString()
        );
    }

    // ── Private helpers ────────────────────────────────────────────────

    private InterviewQuestion generateNextQuestion(InterviewSession session, int seqNum) {
        String type = session.getInterviewType().name();
        String jobTitle = session.getJobTitle();

        List<InterviewQuestion> prev = questionRepository.findBySessionOrderBySequenceNumberAsc(session);
        String asked = prev.stream()
                .map(q -> "- " + q.getQuestionText())
                .reduce("", (a, b) -> a + "\n" + b);

        String prompt = """
            You are conducting a %s interview for a %s position.
            Generate question #%d (of 7 total).

            Rules:
            - Each question must be distinct from previously asked questions
            - Progress from easier to harder as sequence increases
            - Return ONLY this JSON (no markdown, no explanation):
            {"question": "...", "category": "...", "idealAnswer": "..."}

            Categories to use: Technical Skills, Problem Solving, System Design, Behavioral, Situational, Communication, Domain Knowledge
            Previously asked questions:%s
            """.formatted(type, jobTitle, seqNum, asked.isEmpty() ? " None" : asked);

        String raw = chatClient().prompt().user(prompt).call().content();
        return parseQuestionJson(raw, session, seqNum);
    }

    private String evaluateAnswer(String question, String answer, String jobTitle, String interviewType) {
        if (answer == null || answer.isBlank()) {
            return "No answer provided. Score: 2/10. Please attempt to answer the question.";
        }

        String prompt = """
            You are evaluating a candidate answer in a %s interview for %s.

            Question: %s
            Candidate's Answer: %s

            Evaluate and respond in this exact format:
            Score: X/10
            Strengths: [what they did well]
            Improvements: [what they should add or clarify]
            Tip: [one actionable suggestion for next time]
            """.formatted(interviewType, jobTitle, question, answer);

        return chatClient().prompt().user(prompt).call().content();
    }

    private int extractScore(String evaluation) {
        if (evaluation == null) return 5;
        try {
            int idx = evaluation.indexOf("Score:");
            if (idx == -1) idx = evaluation.indexOf("score:");
            if (idx == -1) return 5;
            String sub = evaluation.substring(idx + 6, Math.min(idx + 15, evaluation.length())).trim();
            String num = sub.replaceAll("[^0-9]", " ").trim().split("\\s+")[0];
            int val = Integer.parseInt(num);
            return Math.max(0, Math.min(10, val));
        } catch (Exception e) {
            return 5;
        }
    }

    private InterviewQuestion parseQuestionJson(String raw, InterviewSession session, int seqNum) {
        String questionText = "Tell me about yourself and your experience with " + session.getJobTitle() + ".";
        String category     = "General";
        String idealAnswer  = "";

        try {
            String cleaned = raw.replaceAll("(?s)```json|```", "").trim();
            int start = cleaned.indexOf('{');
            int end   = cleaned.lastIndexOf('}');
            if (start != -1 && end != -1) {
                String json = cleaned.substring(start, end + 1);
                questionText = extractJsonField(json, "question");
                category     = extractJsonField(json, "category");
                idealAnswer  = extractJsonField(json, "idealAnswer");
            }
        } catch (Exception e) {
            log.warn("Could not parse question JSON for session {}: {}", session.getId(), e.getMessage());
        }

        return InterviewQuestion.builder()
                .session(session)
                .questionText(questionText)
                .category(category)
                .idealAnswer(idealAnswer)
                .sequenceNumber(seqNum)
                .build();
    }

    private String extractJsonField(String json, String field) {
        String key = "\"" + field + "\"";
        int idx = json.indexOf(key);
        if (idx == -1) return "";
        int colon = json.indexOf(':', idx + key.length());
        if (colon == -1) return "";
        int quote1 = json.indexOf('"', colon + 1);
        if (quote1 == -1) return "";
        int quote2 = quote1 + 1;
        while (quote2 < json.length()) {
            if (json.charAt(quote2) == '"' && json.charAt(quote2 - 1) != '\\') break;
            quote2++;
        }
        return json.substring(quote1 + 1, quote2);
    }

    @Transactional
    private Map<String, Object> endSession(InterviewSession session, List<InterviewQuestion> questions) {
        List<InterviewQuestion> answered = questions.stream()
                .filter(q -> q.getScore() != null)
                .toList();

        double avg = answered.isEmpty() ? 0 :
                answered.stream().mapToInt(InterviewQuestion::getScore).average().orElse(0);
        double overallScore = Math.round(avg * 10.0) / 10.0;

        String band = overallScore >= 8 ? "Senior" : overallScore >= 6 ? "Mid-Level" : overallScore >= 4 ? "Junior" : "Entry-Level";

        String feedbackPrompt = """
            Based on these interview results for a %s position (%s interview):
            Average score: %.1f/10, Band: %s

            Provide a 3-sentence final performance summary covering:
            1. Overall impression
            2. Top strength demonstrated
            3. Single most important improvement area
            """.formatted(session.getJobTitle(), session.getInterviewType().name(), overallScore, band);

        String feedback = "Interview completed. Score: " + overallScore + "/10 (" + band + " level).";
        try {
            feedback = chatClient().prompt().user(feedbackPrompt).call().content();
        } catch (Exception e) {
            log.warn("Could not generate final feedback: {}", e.getMessage());
        }

        session.setStatus(InterviewSession.SessionStatus.COMPLETED);
        session.setOverallScore(overallScore);
        session.setFeedback(feedback);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);

        List<Map<String, Object>> qSummary = answered.stream()
                .map(q -> Map.<String, Object>of(
                        "question",   q.getQuestionText(),
                        "category",   q.getCategory(),
                        "score",      q.getScore(),
                        "evaluation", q.getAiEvaluation() != null ? q.getAiEvaluation() : ""
                ))
                .toList();

        return Map.of(
                "sessionComplete",  true,
                "overallScore",     overallScore,
                "band",             band,
                "feedback",         feedback,
                "questionsAnswered", answered.size(),
                "questions",        qSummary
        );
    }
}
