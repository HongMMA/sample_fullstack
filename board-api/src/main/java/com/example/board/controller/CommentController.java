package com.example.board.controller;

import com.example.board.dto.CommentCreateRequest;
import com.example.board.dto.CommentResponse;
import com.example.board.dto.CommentUpdateRequest;
import com.example.board.domain.UserAccount;
import com.example.board.service.AuthService;
import com.example.board.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final AuthService authService;

    @GetMapping("/posts/{postId}/comments")
    public List<CommentResponse> findByPostId(
            @PathVariable Long postId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return commentService.findByPostId(postId, authService.isSuperAdmin(authorizationHeader));
    }

    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse create(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long postId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        UserAccount userAccount = authService.authenticate(authorizationHeader);
        boolean includeHidden = AuthService.SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId());
        return commentService.create(userAccount, postId, request, includeHidden);
    }

    @PutMapping("/comments/{id}")
    public CommentResponse update(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long id,
            @Valid @RequestBody CommentUpdateRequest request
    ) {
        return commentService.update(authService.authenticate(authorizationHeader), id, request);
    }

    @DeleteMapping("/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long id
    ) {
        commentService.delete(authService.authenticate(authorizationHeader), id);
    }
}
