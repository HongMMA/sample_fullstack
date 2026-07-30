package com.example.board.controller;

import com.example.board.dto.PostWriteSettingResponse;
import com.example.board.dto.PostWriteSettingUpdateRequest;
import com.example.board.service.AppSettingService;
import com.example.board.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class AdminSettingController {

    private final AppSettingService appSettingService;
    private final AuthService authService;

    @GetMapping("/post-write")
    public PostWriteSettingResponse getPostWriteSetting() {
        return appSettingService.getPostWriteSetting();
    }

    @PutMapping("/post-write")
    public PostWriteSettingResponse updatePostWriteSetting(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody PostWriteSettingUpdateRequest request
    ) {
        authService.requireSuperAdmin(authorizationHeader);
        return appSettingService.updatePostWriteSetting(request.enabled());
    }
}
