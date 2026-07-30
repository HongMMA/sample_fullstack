package com.example.board.service;

import com.example.board.domain.Comment;
import com.example.board.domain.Post;
import com.example.board.domain.UserAccount;
import com.example.board.dto.CommentCreateRequest;
import com.example.board.dto.CommentResponse;
import com.example.board.dto.CommentUpdateRequest;
import com.example.board.exception.BadRequestException;
import com.example.board.exception.CommentNotFoundException;
import com.example.board.exception.ForbiddenException;
import com.example.board.repository.CommentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private static final String GUEST_PREFIX = "guest";

    private final CommentRepository commentRepository;
    private final PostService postService;

    public List<CommentResponse> findByPostId(Long postId, boolean includeHidden) {
        postService.getVisiblePostOrThrow(postId, includeHidden);
        return commentRepository.findByPostIdAndParentIsNullOrderByIdAsc(postId).stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse create(
            UserAccount userAccount,
            Long postId,
            CommentCreateRequest request,
            boolean includeHidden
    ) {
        Post post = postService.getVisiblePostOrThrow(postId, includeHidden);

        Comment parent = null;
        if (request.parentId() != null) {
            parent = getCommentOrThrow(request.parentId());
            if (!parent.getPost().getId().equals(postId)) {
                throw new BadRequestException("대댓글은 같은 게시글의 댓글에만 달 수 있습니다.");
            }
        }

        Comment comment = Comment.builder()
                .post(post)
                .parent(parent)
                .content(request.content())
                .author(userAccount.getLoginId())
                .build();

        return CommentResponse.from(commentRepository.save(comment));
    }

    @Transactional
    public CommentResponse update(UserAccount userAccount, Long id, CommentUpdateRequest request) {
        Comment comment = getCommentOrThrow(id);
        assertEditable(userAccount, comment);
        comment.update(request.content());
        return CommentResponse.from(comment);
    }

    @Transactional
    public void delete(UserAccount userAccount, Long id) {
        Comment comment = getCommentOrThrow(id);
        assertEditable(userAccount, comment);
        commentRepository.delete(comment);
    }

    private void assertEditable(UserAccount userAccount, Comment comment) {
        if (comment.getAuthor().startsWith(GUEST_PREFIX)) {
            throw new ForbiddenException("게스트 댓글은 수정하거나 삭제할 수 없습니다.");
        }
        if (!comment.getAuthor().equals(userAccount.getLoginId())) {
            throw new ForbiddenException("본인이 작성한 댓글만 수정하거나 삭제할 수 있습니다.");
        }
    }

    private Comment getCommentOrThrow(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new CommentNotFoundException(id));
    }
}
