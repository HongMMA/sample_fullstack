package com.example.board.controller;

import com.example.board.domain.UserAccount;
import com.example.board.dto.PostCreateRequest;
import com.example.board.dto.PostHiddenUpdateRequest;
import com.example.board.dto.PostResponse;
import com.example.board.dto.PostUpdateRequest;
import com.example.board.service.AuthService;
import com.example.board.service.PostService;
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
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final AuthService authService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody PostCreateRequest request
    ) {
        return postService.create(authService.authenticate(authorizationHeader), request);
    }

    @GetMapping
    public List<PostResponse> findAll(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return postService.findAll(
                authService.isSuperAdmin(authorizationHeader),
                authService.findLoginIdOrNull(authorizationHeader)
        );
    }

    @GetMapping("/{id}")
    public PostResponse findById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return postService.findById(
                id,
                authService.isSuperAdmin(authorizationHeader),
                authService.findLoginIdOrNull(authorizationHeader)
        );
    }

    @PostMapping("/{id}/views")
    public PostResponse incrementView(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long id
    ) {
        UserAccount viewer = authService.authenticate(authorizationHeader);
        boolean includeHidden = AuthService.SUPERADMIN_LOGIN_ID.equals(viewer.getLoginId());
        return postService.incrementView(viewer, id, includeHidden);
    }

    @PostMapping("/{id}/likes")
    public PostResponse toggleLike(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long id
    ) {
        UserAccount userAccount = authService.authenticate(authorizationHeader);
        boolean includeHidden = AuthService.SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId());
        return postService.toggleLike(userAccount, id, includeHidden);
    }

    @PutMapping("/{id}")
    public PostResponse update(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long id,
            @Valid @RequestBody PostUpdateRequest request
    ) {
        return postService.update(authService.authenticate(authorizationHeader), id, request);
    }

    @PutMapping("/{id}/hidden")
    public PostResponse updateHidden(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long id,
            @Valid @RequestBody PostHiddenUpdateRequest request
    ) {
        UserAccount admin = authService.requireSuperAdmin(authorizationHeader);
        return postService.updateHidden(id, request.hidden(), admin.getLoginId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long id
    ) {
        postService.delete(authService.authenticate(authorizationHeader), id);
    }
}
