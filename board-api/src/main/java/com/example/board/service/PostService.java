package com.example.board.service;

import com.example.board.domain.Post;
import com.example.board.domain.UserAccount;
import com.example.board.dto.PostCreateRequest;
import com.example.board.dto.PostResponse;
import com.example.board.dto.PostUpdateRequest;
import com.example.board.exception.ForbiddenException;
import com.example.board.exception.PostNotFoundException;
import com.example.board.repository.PostRepository;
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

    private final PostRepository postRepository;

    @Transactional
    public PostResponse create(UserAccount userAccount, PostCreateRequest request) {
        Post post = Post.builder()
                .title(request.title())
                .content(request.content())
                .author(userAccount.getLoginId())
                .build();
        return PostResponse.from(postRepository.save(post));
    }

    public List<PostResponse> findAll() {
        return postRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(PostResponse::from)
                .toList();
    }

    public PostResponse findById(Long id) {
        return PostResponse.from(getPostOrThrow(id));
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
