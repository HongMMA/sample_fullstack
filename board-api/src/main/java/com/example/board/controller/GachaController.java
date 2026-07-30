package com.example.board.controller;

import com.example.board.domain.UserAccount;
import com.example.board.dto.GachaProfileResponse;
import com.example.board.dto.GachaPullRequest;
import com.example.board.dto.GachaPullResponse;
import com.example.board.dto.GachaRankingEntryResponse;
import com.example.board.dto.GachaThemeResponse;
import com.example.board.service.AuthService;
import com.example.board.service.GachaService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gacha")
@RequiredArgsConstructor
public class GachaController {

    private final GachaService gachaService;
    private final AuthService authService;

    @GetMapping("/theme")
    public GachaThemeResponse theme(@RequestHeader("Authorization") String authorizationHeader) {
        authService.requireSuperAdmin(authorizationHeader);
        return gachaService.getActiveTheme();
    }

    @GetMapping("/me")
    public GachaProfileResponse me(@RequestHeader("Authorization") String authorizationHeader) {
        UserAccount userAccount = authService.requireSuperAdmin(authorizationHeader);
        return gachaService.getProfile(userAccount);
    }

    @PostMapping("/pull")
    public GachaPullResponse pull(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(required = false) GachaPullRequest request
    ) {
        UserAccount userAccount = authService.requireSuperAdmin(authorizationHeader);
        return gachaService.pull(userAccount, request != null ? request.rarity() : null);
    }

    @GetMapping("/ranking")
    public List<GachaRankingEntryResponse> ranking(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        authService.requireSuperAdmin(authorizationHeader);
        return gachaService.getRanking();
    }
}
