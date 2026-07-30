package com.example.board.service;

import com.example.board.domain.Post;
import com.example.board.domain.UserAccount;
import com.example.board.dto.PostCreateRequest;
import com.example.board.dto.PostResponse;
import com.example.board.dto.PostUpdateRequest;
import com.example.board.exception.ForbiddenException;
import com.example.board.exception.PostNotFoundException;
import com.example.board.exception.TooManyRequestsException;
import com.example.board.repository.PostRepository;
import java.time.LocalDateTime;
import java.util.List;
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
    private final AppSettingService appSettingService;

    @Transactional
    public PostResponse create(UserAccount userAccount, PostCreateRequest request) {
        boolean isSuperAdmin = AuthService.SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId());
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
        return PostResponse.from(postRepository.save(post));
    }

    public List<PostResponse> findAll(boolean includeHidden) {
        List<Post> posts = includeHidden
                ? postRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                : postRepository.findByHiddenFalse(Sort.by(Sort.Direction.DESC, "id"));
        return posts.stream()
                .map(PostResponse::from)
                .toList();
    }

    public PostResponse findById(Long id, boolean includeHidden) {
        return PostResponse.from(getVisiblePostOrThrow(id, includeHidden));
    }

    @Transactional
    public PostResponse update(UserAccount userAccount, Long id, PostUpdateRequest request) {
        Post post = getPostOrThrow(id);
        assertEditable(userAccount, post);
        post.update(request.title(), request.content());
        return PostResponse.from(post);
    }

    @Transactional
    public void delete(UserAccount userAccount, Long id) {
        Post post = getPostOrThrow(id);
        assertEditable(userAccount, post);
        postRepository.delete(post);
    }

    @Transactional
    public PostResponse updateHidden(Long id, boolean hidden) {
        Post post = getPostOrThrow(id);
        post.updateHidden(hidden);
        return PostResponse.from(post);
    }

    public Post getVisiblePostOrThrow(Long id, boolean includeHidden) {
        Post post = getPostOrThrow(id);
        if (post.isHidden() && !includeHidden) {
            throw new PostNotFoundException(id);
        }
        return post;
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
