package com.resume.backend.demo.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Enables PGVector RAG pipeline only when app.rag.enabled=true (requires PostgreSQL + pgvector extension).
 * Local H2 dev mode: RAG is skipped, chatbot answers without resume context.
 * Docker/prod mode: full RAG with resume embeddings.
 */
@Configuration
@ConditionalOnProperty(name = "app.rag.enabled", havingValue = "true")
public class VectorStoreConfig {

    @Bean
    public VectorStore vectorStore(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel) {
        return PgVectorStore.builder(jdbcTemplate, embeddingModel)
                .initializeSchema(true)
                .build();
    }
}
