package com.resume.backend.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioGeneratorService {

    private final ChatClient.Builder chatClientBuilder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<String, String[]> THEMES = Map.of(
        "MINIMAL",  new String[]{"#ffffff", "#111111", "#6366f1", "Inter, sans-serif"},
        "TECH",     new String[]{"#0f172a", "#e2e8f0", "#38bdf8", "'Fira Code', monospace"},
        "CREATIVE", new String[]{"#fdf4ff", "#1e1b4b", "#d946ef", "'Poppins', sans-serif"}
    );

    public record PortfolioResult(String html, byte[] zipBytes, String previewKey) {}

    public PortfolioResult generate(String resumeJson, String theme, Long userId) {
        String themeKey = theme != null ? theme.toUpperCase() : "MINIMAL";
        String[] colors = THEMES.getOrDefault(themeKey, THEMES.get("MINIMAL"));

        // Parse resume JSON
        String name = "Your Name", title = "Software Engineer", summary = "",
               email = "", github = "", linkedin = "";
        List<String> skills = new ArrayList<>();
        List<Map<String, Object>> projects = new ArrayList<>();
        List<Map<String, Object>> experience = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(resumeJson);
            JsonNode pi = root.path("personalInfo");
            name     = text(pi, "name",     name);
            title    = text(pi, "title",    title);
            email    = text(pi, "email",    email);
            github   = text(pi, "github",   github);
            linkedin = text(pi, "linkedin", linkedin);
            summary  = text(root, "summary", "");

            JsonNode sk = root.path("skills");
            if (sk.isArray()) for (JsonNode s : sk) skills.add(s.asText());

            JsonNode pr = root.path("projects");
            if (pr.isArray()) for (JsonNode p : pr) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name",  text(p, "name", "Project"));
                m.put("desc",  text(p, "description", ""));
                List<String> techs = new ArrayList<>();
                JsonNode tNode = p.path("technologies");
                if (tNode.isArray()) for (JsonNode t : tNode) techs.add(t.asText());
                m.put("tech", techs);
                projects.add(m);
            }

            JsonNode ex = root.path("experience");
            if (ex.isArray()) for (JsonNode e : ex) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("company",  text(e, "company", ""));
                m.put("position", text(e, "position", ""));
                m.put("duration", text(e, "duration", ""));
                experience.add(m);
            }
        } catch (Exception e) {
            log.warn("Could not parse resume JSON for portfolio: {}", e.getMessage());
        }

        // AI-written hero tagline + about section
        String heroTagline = "Building impactful software solutions.";
        String aboutText   = summary.isBlank() ? "A passionate engineer with a love for clean code and elegant solutions." : summary;
        try {
            String prompt = """
                Write a compelling 1-sentence personal tagline for a portfolio website hero section.
                Person: %s, Role: %s
                Skills: %s
                Be punchy, memorable, and professional. Return ONLY the tagline text.
                """.formatted(name, title, String.join(", ", skills.stream().limit(6).toList()));
            heroTagline = chatClientBuilder.build().prompt().user(prompt).call().content().trim()
                    .replaceAll("^[\"']|[\"']$", "");
        } catch (Exception e) {
            log.debug("AI tagline failed, using default: {}", e.getMessage());
        }

        String html = buildHtml(name, title, heroTagline, aboutText, email, github, linkedin,
                                skills, projects, experience, colors);

        byte[] zip = buildZip(html, name);
        String previewKey = userId + "-" + System.currentTimeMillis();

        return new PortfolioResult(html, zip, previewKey);
    }

    // ── HTML builder ──────────────────────────────────────────────────

    private String buildHtml(String name, String title, String tagline, String about,
                              String email, String github, String linkedin,
                              List<String> skills, List<Map<String, Object>> projects,
                              List<Map<String, Object>> experience, String[] c) {

        String bg = c[0], fg = c[1], accent = c[2], font = c[3];

        StringBuilder skillsHtml = new StringBuilder();
        for (String s : skills) {
            skillsHtml.append("""
                <span style="background:%s22;color:%s;padding:4px 12px;border-radius:999px;
                      font-size:0.85rem;font-weight:500;border:1px solid %s44;">%s</span>
                """.formatted(accent, accent, accent, escHtml(s)));
        }

        StringBuilder projectsHtml = new StringBuilder();
        for (Map<String, Object> p : projects) {
            String techs = ((List<?>) p.getOrDefault("tech", List.of())).stream()
                    .map(t -> "<span style='font-size:0.75rem;opacity:0.7;'>%s</span>".formatted(escHtml(t.toString())))
                    .reduce("", (a, b) -> a + " · " + b).replaceFirst("^ · ", "");
            projectsHtml.append("""
                <div style="background:%s08;border:1px solid %s22;border-radius:12px;padding:20px;margin-bottom:16px;">
                  <h3 style="color:%s;margin:0 0 6px;">%s</h3>
                  <p style="margin:0 0 10px;opacity:0.8;font-size:0.9rem;">%s</p>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;">%s</div>
                </div>
                """.formatted(accent, accent, accent, escHtml(p.get("name").toString()),
                               escHtml(p.get("desc").toString()), techs));
        }

        StringBuilder expHtml = new StringBuilder();
        for (Map<String, Object> e : experience) {
            expHtml.append("""
                <div style="padding:12px 0;border-bottom:1px solid %s22;">
                  <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;">
                    <strong>%s</strong>
                    <span style="opacity:0.6;font-size:0.85rem;">%s</span>
                  </div>
                  <div style="color:%s;font-size:0.9rem;margin-top:2px;">%s</div>
                </div>
                """.formatted(accent, escHtml(e.getOrDefault("company","").toString()),
                               escHtml(e.getOrDefault("duration","").toString()),
                               accent, escHtml(e.getOrDefault("position","").toString())));
        }

        String contactLinks = buildContactLinks(email, github, linkedin, accent);

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>%s — Portfolio</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"/>
              <style>
                *{box-sizing:border-box;margin:0;padding:0}
                body{background:%s;color:%s;font-family:%s;line-height:1.6;min-height:100vh}
                a{color:%s;text-decoration:none}a:hover{opacity:0.8}
                section{max-width:860px;margin:0 auto;padding:60px 24px}
                h2{font-size:1.6rem;margin-bottom:28px;color:%s;border-left:4px solid %s;padding-left:12px}
                nav{position:sticky;top:0;background:%scc;backdrop-filter:blur(8px);border-bottom:1px solid %s22;
                    padding:12px 24px;display:flex;justify-content:space-between;align-items:center;z-index:100}
                .hero{text-align:center;padding:100px 24px 80px;background:linear-gradient(135deg,%s08 0%%,%s04 100%%)}
                .badge-grid{display:flex;flex-wrap:wrap;gap:8px}
              </style>
            </head>
            <body>
            <nav>
              <strong style="font-size:1.1rem">%s</strong>
              <div style="display:flex;gap:20px;font-size:0.9rem">
                <a href="#about">About</a><a href="#skills">Skills</a>
                <a href="#projects">Projects</a><a href="#experience">Experience</a>
                <a href="#contact">Contact</a>
              </div>
            </nav>

            <div class="hero">
              <h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:700;margin-bottom:12px">%s</h1>
              <p style="font-size:1.2rem;color:%s;margin-bottom:20px">%s</p>
              <p style="max-width:600px;margin:0 auto;opacity:0.75;font-size:0.95rem">%s</p>
              <div style="margin-top:28px;display:flex;gap:16px;justify-content:center">%s</div>
            </div>

            <section id="about"><h2>About Me</h2><p style="font-size:1rem;opacity:0.85;max-width:680px">%s</p></section>

            <section id="skills"><h2>Skills</h2><div class="badge-grid">%s</div></section>

            %s

            %s

            <section id="contact" style="text-align:center;padding:60px 24px">
              <h2 style="border:none;padding:0;text-align:center">Let's Connect</h2>
              <div style="margin-top:24px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap">%s</div>
            </section>

            <footer style="text-align:center;padding:24px;opacity:0.4;font-size:0.8rem">
              Generated with AI Resume Maker
            </footer>
            </body></html>
            """.formatted(
                escHtml(name), bg, fg, font, accent, fg, accent, bg, accent, accent, accent,
                escHtml(name), escHtml(name), accent, escHtml(title), escHtml(tagline), contactLinks,
                escHtml(about), skillsHtml,
                projects.isEmpty() ? "" : "<section id=\"projects\"><h2>Projects</h2>" + projectsHtml + "</section>",
                experience.isEmpty() ? "" : "<section id=\"experience\"><h2>Experience</h2>" + expHtml + "</section>",
                contactLinks
        );
    }

    private String buildContactLinks(String email, String github, String linkedin, String accent) {
        String style = "style=\"background:%s;color:white;padding:10px 22px;border-radius:8px;font-weight:500;\"".formatted(accent);
        StringBuilder sb = new StringBuilder();
        if (!email.isBlank())    sb.append("<a href=\"mailto:%s\" %s>Email Me</a>".formatted(escHtml(email), style));
        if (!github.isBlank())   sb.append("<a href=\"%s\" target=\"_blank\" %s>GitHub</a>".formatted(escHtml(github), style));
        if (!linkedin.isBlank()) sb.append("<a href=\"%s\" target=\"_blank\" %s>LinkedIn</a>".formatted(escHtml(linkedin), style));
        if (sb.isEmpty())        sb.append("<span %s>%s</span>".formatted(style, "Get In Touch"));
        return sb.toString();
    }

    private byte[] buildZip(String html, String name) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry("index.html");
            byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
            entry.setSize(bytes.length);
            zos.putNextEntry(entry);
            zos.write(bytes);
            zos.closeEntry();
            zos.finish();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("ZIP build failed: {}", e.getMessage());
            return new byte[0];
        }
    }

    private String text(JsonNode node, String field, String fallback) {
        if (node == null) return fallback;
        JsonNode v = node.path(field);
        return v.isMissingNode() || v.isNull() ? fallback : v.asText(fallback);
    }

    private String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                .replace("\"","&quot;").replace("'","&#39;");
    }
}
