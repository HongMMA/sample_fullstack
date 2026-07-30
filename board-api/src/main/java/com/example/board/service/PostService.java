package com.example.board.service;

import com.example.board.domain.Post;
import com.example.board.domain.PostLike;
import com.example.board.domain.UserAccount;
import com.example.board.dto.PostCreateRequest;
import com.example.board.dto.PostResponse;
import com.example.board.dto.PostUpdateRequest;
import com.example.board.exception.ForbiddenException;
import com.example.board.exception.PostNotFoundException;
import com.example.board.exception.TooManyRequestsException;
import com.example.board.repository.CommentRepository;
import com.example.board.repository.PostLikeRepository;
import com.example.board.repository.PostRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private static final String GUEST_PREFIX = "guest";
    private static final int MAX_POSTS_PER_WINDOW = 3;
    private static final int POST_RATE_LIMIT_MINUTES = 5;

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final AppSettingService appSettingService;

    @Transactional
    public PostResponse create(UserAccount userAccount, PostCreateRequest request) {
        boolean isSuperAdmin = AuthService.SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId());
        if (userAccount.getLoginId().startsWith(GUEST_PREFIX)) {
            throw new ForbiddenException("게스트는 게시글을 작성할 수 없습니다. 로그인 후 이용해 주세요.");
        }
        if (!isSuperAdmin && !appSettingService.isPostWriteEnabled()) {
            throw new ForbiddenException("현재 글쓰기가 비활성화되어 있습니다.");
        }

        if (!isSuperAdmin) {
            LocalDateTime windowStart = LocalDateTime.now().minusMinutes(POST_RATE_LIMIT_MINUTES);
            long recentCount = postRepository.countByAuthorAndCreatedAtAfter(
                    userAccount.getLoginId(),
                    windowStart
            );
            if (recentCount >= MAX_POSTS_PER_WINDOW) {
                throw new TooManyRequestsException(
                        "어뷰징 방지를 위해 5분 동안 최대 3개의 게시글만 작성할 수 있습니다."
                );
            }
        }

        Post post = Post.builder()
                .title(request.title())
                .content(request.content())
                .author(userAccount.getLoginId())
                .build();
        return toResponse(postRepository.save(post), userAccount.getLoginId());
    }

    public List<PostResponse> findAll(boolean includeHidden, String viewerLoginId) {
        List<Post> posts = includeHidden
                ? postRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                : postRepository.findByHiddenFalse(Sort.by(Sort.Direction.DESC, "id"));
        Map<Long, Long> commentCounts = loadCommentCounts();
        return posts.stream()
                .map(post -> PostResponse.from(
                        post,
                        commentCounts.getOrDefault(post.getId(), 0L),
                        isLikedBy(post.getId(), viewerLoginId)
                ))
                .toList();
    }

    public PostResponse findById(Long id, boolean includeHidden, String viewerLoginId) {
        return toResponse(getVisiblePostOrThrow(id, includeHidden), viewerLoginId);
    }

    @Transactional
    public PostResponse update(UserAccount userAccount, Long id, PostUpdateRequest request) {
        Post post = getPostOrThrow(id);
        assertEditable(userAccount, post);
        post.update(request.title(), request.content());
        return toResponse(post, userAccount.getLoginId());
    }

    @Transactional
    public void delete(UserAccount userAccount, Long id) {
        Post post = getPostOrThrow(id);
        assertEditable(userAccount, post);
        postRepository.delete(post);
    }

    @Transactional
    public PostResponse updateHidden(Long id, boolean hidden, String viewerLoginId) {
        Post post = getPostOrThrow(id);
        post.updateHidden(hidden);
        return toResponse(post, viewerLoginId);
    }

    @Transactional
    public PostResponse incrementView(UserAccount viewer, Long id, boolean includeHidden) {
        Post post = getVisiblePostOrThrow(id, includeHidden);
        if (!post.getAuthor().equals(viewer.getLoginId())) {
            post.incrementViewCount();
        }
        return toResponse(post, viewer.getLoginId());
    }

    @Transactional
    public PostResponse toggleLike(UserAccount userAccount, Long id, boolean includeHidden) {
        Post post = getVisiblePostOrThrow(id, includeHidden);
        Optional<PostLike> existing = postLikeRepository.findByPostIdAndLoginId(id, userAccount.getLoginId());
        if (existing.isPresent()) {
            postLikeRepository.delete(existing.get());
            post.decrementLikeCount();
        } else {
            postLikeRepository.save(PostLike.builder()
                    .post(post)
                    .loginId(userAccount.getLoginId())
                    .build());
            post.incrementLikeCount();
        }
        return toResponse(post, userAccount.getLoginId());
    }

    public Post getVisiblePostOrThrow(Long id, boolean includeHidden) {
        Post post = getPostOrThrow(id);
        if (post.isHidden() && !includeHidden) {
            throw new PostNotFoundException(id);
        }
        return post;
    }

    private PostResponse toResponse(Post post, String viewerLoginId) {
        return PostResponse.from(
                post,
                commentRepository.countByPostId(post.getId()),
                isLikedBy(post.getId(), viewerLoginId)
        );
    }

    private boolean isLikedBy(Long postId, String viewerLoginId) {
        if (viewerLoginId == null || viewerLoginId.isBlank()) {
            return false;
        }
        return postLikeRepository.existsByPostIdAndLoginId(postId, viewerLoginId);
    }

    private Map<Long, Long> loadCommentCounts() {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : commentRepository.countGroupedByPostId()) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    private void assertEditable(UserAccount userAccount, Post post) {
        if (post.getAuthor().startsWith(GUEST_PREFIX)) {
            throw new ForbiddenException("게스트 게시글은 수정하거나 삭제할 수 없습니다.");
        }
        if (!post.getAuthor().equals(userAccount.getLoginId())) {
            throw new ForbiddenException("본인이 작성한 게시글만 수정하거나 삭제할 수 있습니다.");
        }
    }

    private Post getPostOrThrow(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException(id));
    }
}
