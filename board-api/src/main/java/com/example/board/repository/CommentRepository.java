package com.example.board.repository;

import com.example.board.domain.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdAndParentIsNullOrderByIdAsc(Long postId);

    long countByPostId(Long postId);

    @Query("select c.post.id, count(c) from Comment c group by c.post.id")
    List<Object[]> countGroupedByPostId();
}
