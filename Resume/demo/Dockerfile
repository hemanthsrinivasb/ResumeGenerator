FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app
COPY target/resume-ai.jar app.jar
EXPOSE 8050
ENTRYPOINT ["java", "-jar", "app.jar"]
