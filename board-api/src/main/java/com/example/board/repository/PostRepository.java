package com.example.board.repository;

import com.example.board.domain.Post;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByHiddenFalse(Sort sort);

    long countByAuthorAndCreatedAtAfter(String author, LocalDateTime createdAt);
}
