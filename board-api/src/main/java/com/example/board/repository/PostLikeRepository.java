package com.example.board.repository;

import com.example.board.domain.PostLike;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    Optional<PostLike> findByPostIdAndLoginId(Long postId, String loginId);

    boolean existsByPostIdAndLoginId(Long postId, String loginId);
}
