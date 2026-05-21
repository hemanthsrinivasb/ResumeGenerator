package com.resume.backend.demo.repository;

import com.resume.backend.demo.model.PromptFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PromptFeedbackRepository extends JpaRepository<PromptFeedback, Long> {

    List<PromptFeedback> findByEndpointTypeOrderByCreatedAtDesc(String endpointType);

    List<PromptFeedback> findTop20ByEndpointTypeOrderByCreatedAtDesc(String endpointType);

    @Query("SELECT AVG(f.rating) FROM PromptFeedback f WHERE f.endpointType = :type")
    Double averageRatingByEndpointType(@Param("type") String type);

    @Query("SELECT f.endpointType, AVG(f.rating), COUNT(f) FROM PromptFeedback f GROUP BY f.endpointType")
    List<Object[]> aggregateByEndpoint();
}
