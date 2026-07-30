package com.example.board.controller;

import com.example.board.domain.GachaRarity;
import com.example.board.domain.UserAccount;
import com.example.board.dto.GachaProfileResponse;
import com.example.board.dto.GachaPullRequest;
import com.example.board.dto.GachaPullResponse;
import com.example.board.dto.GachaRankingEntryResponse;
import com.example.board.dto.GachaThemeResponse;
import com.example.board.exception.ForbiddenException;
import com.example.board.service.AppSettingService;
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
    private final AppSettingService appSettingService;

    @GetMapping("/theme")
    public GachaThemeResponse theme(@RequestHeader("Authorization") String authorizationHeader) {
        requireGachaPlayer(authorizationHeader);
        return gachaService.getActiveTheme();
    }

    @GetMapping("/me")
    public GachaProfileResponse me(@RequestHeader("Authorization") String authorizationHeader) {
        UserAccount userAccount = requireGachaPlayer(authorizationHeader);
        return gachaService.getProfile(userAccount);
    }

    @PostMapping("/pull")
    public GachaPullResponse pull(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(required = false) GachaPullRequest request
    ) {
        UserAccount userAccount = requireGachaPlayer(authorizationHeader);
        GachaRarity forcedRarity = null;
        if (request != null && request.rarity() != null) {
            if (!AuthService.SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId())) {
                throw new ForbiddenException("등급 지정 뽑기는 관리자만 가능합니다.");
            }
            forcedRarity = request.rarity();
        }
        return gachaService.pull(userAccount, forcedRarity);
    }

    @GetMapping("/ranking")
    public List<GachaRankingEntryResponse> ranking(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        requireGachaPlayer(authorizationHeader);
        return gachaService.getRanking();
    }

    private UserAccount requireGachaPlayer(String authorizationHeader) {
        UserAccount userAccount = authService.authenticate(authorizationHeader);
        if (userAccount.getLoginId().startsWith("guest")) {
            throw new ForbiddenException("게스트는 가챠를 이용할 수 없습니다.");
        }
        if (!AuthService.SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId())
                && !appSettingService.isGachaEnabled()) {
            throw new ForbiddenException("가챠 서비스가 아직 오픈되지 않았습니다.");
        }
        return userAccount;
    }
}
