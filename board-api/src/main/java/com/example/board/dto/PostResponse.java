package com.example.board.dto;

import com.example.board.domain.Post;
import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        String title,
        String content,
        String author,
        boolean hidden,
        long commentCount,
        long viewCount,
        long likeCount,
        boolean likedByMe,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PostResponse from(Post post, long commentCount, boolean likedByMe) {
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getAuthor(),
                post.isHidden(),
                commentCount,
                post.getViewCount(),
                post.getLikeCount(),
                likedByMe,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
