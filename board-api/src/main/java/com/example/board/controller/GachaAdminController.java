package com.example.board.controller;

import com.example.board.dto.GachaThemeOptionResponse;
import com.example.board.dto.GachaThemeResponse;
import com.example.board.dto.GachaThemeUpdateRequest;
import com.example.board.service.AuthService;
import com.example.board.service.GachaThemeAdminService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/gacha")
@RequiredArgsConstructor
public class GachaAdminController {

    private final GachaThemeAdminService gachaThemeAdminService;
    private final AuthService authService;

    @GetMapping("/themes")
    public List<GachaThemeOptionResponse> listThemes(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        authService.requireSuperAdmin(authorizationHeader);
        return gachaThemeAdminService.listThemes();
    }

    @PutMapping("/theme")
    public GachaThemeResponse switchTheme(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody GachaThemeUpdateRequest request
    ) {
        authService.requireSuperAdmin(authorizationHeader);
        return gachaThemeAdminService.switchTheme(request.themeCode());
    }
}
