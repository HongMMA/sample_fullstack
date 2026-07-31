package com.example.board.controller;

import com.example.board.domain.GachaRarity;
import com.example.board.domain.UserAccount;
import com.example.board.dto.GachaCharacterResponse;
import com.example.board.dto.GachaProfileResponse;
import com.example.board.dto.GachaPullRequest;
import com.example.board.dto.GachaPullResponse;
import com.example.board.dto.GachaRankingEntryResponse;
import com.example.board.dto.GachaThemeResponse;
import com.example.board.dto.PostWriteSettingResponse;
import com.example.board.exception.BadRequestException;
import com.example.board.exception.ForbiddenException;
import com.example.board.service.AppSettingService;
import com.example.board.service.AuthService;
import com.example.board.service.GachaCharacterAdminService;
import com.example.board.service.GachaService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/gacha")
@RequiredArgsConstructor
public class GachaController {

    private final GachaService gachaService;
    private final AuthService authService;
    private final AppSettingService appSettingService;
    private final GachaCharacterAdminService gachaCharacterAdminService;

    @GetMapping("/theme")
    public GachaThemeResponse theme(@RequestHeader("Authorization") String authorizationHeader) {
        requireGachaPageAccess(authorizationHeader);
        return gachaService.getActiveTheme();
    }

    @GetMapping("/me")
    public GachaProfileResponse me(@RequestHeader("Authorization") String authorizationHeader) {
        UserAccount userAccount = requireGachaPageAccess(authorizationHeader);
        return gachaService.getProfile(userAccount);
    }

    @PostMapping("/pull")
    public GachaPullResponse pull(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody(required = false) GachaPullRequest request
    ) {
        UserAccount userAccount = requireGachaPlayer(authorizationHeader);
        int count = request != null && request.count() != null ? request.count() : 1;
        GachaRarity forcedRarity = null;
        if (request != null && request.rarity() != null) {
            if (!AuthService.SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId())) {
                throw new ForbiddenException("등급 지정 뽑기는 관리자만 가능합니다.");
            }
            forcedRarity = request.rarity();
        }
        return gachaService.pull(userAccount, forcedRarity, count);
    }

    @GetMapping("/ranking")
    public List<GachaRankingEntryResponse> ranking(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        requireGachaPageAccess(authorizationHeader);
        return gachaService.getRanking();
    }

    @GetMapping("/character-upload-enabled")
    public PostWriteSettingResponse characterUploadEnabled() {
        return appSettingService.getGachaCharacterUploadSetting();
    }

    @GetMapping("/characters")
    public List<GachaCharacterResponse> listCharacters(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam(value = "themeCode", defaultValue = "dkt") String themeCode
    ) {
        requireCharacterUploader(authorizationHeader);
        if (!"dkt".equals(themeCode)) {
            return List.of();
        }
        return gachaCharacterAdminService.listDktCharacters();
    }

    @PostMapping(value = "/characters", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GachaCharacterResponse uploadCharacter(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam(value = "themeCode", defaultValue = "dkt") String themeCode,
            @RequestParam("name") String name,
            @RequestParam("image") MultipartFile image
    ) {
        requireCharacterUploader(authorizationHeader);
        if (!"dkt".equals(themeCode)) {
            throw new BadRequestException("현재는 DKT 테마만 캐릭터 업로드를 지원합니다.");
        }
        return gachaCharacterAdminService.uploadDktCharacter(name, image);
    }

    private UserAccount requireGachaPageAccess(String authorizationHeader) {
        UserAccount userAccount = requireNonGuest(authorizationHeader);
        if (isSuperAdmin(userAccount)
                || appSettingService.isGachaEnabled()
                || appSettingService.isGachaCharacterUploadEnabled()) {
            return userAccount;
        }
        throw new ForbiddenException("가챠 서비스가 아직 오픈되지 않았습니다.");
    }

    private UserAccount requireGachaPlayer(String authorizationHeader) {
        UserAccount userAccount = requireNonGuest(authorizationHeader);
        if (!isSuperAdmin(userAccount) && !appSettingService.isGachaEnabled()) {
            throw new ForbiddenException("가챠 서비스가 아직 오픈되지 않았습니다.");
        }
        return userAccount;
    }

    private UserAccount requireCharacterUploader(String authorizationHeader) {
        UserAccount userAccount = requireNonGuest(authorizationHeader);
        if (!isSuperAdmin(userAccount) && !appSettingService.isGachaCharacterUploadEnabled()) {
            throw new ForbiddenException("캐릭터 업로드가 아직 오픈되지 않았습니다.");
        }
        return userAccount;
    }

    private UserAccount requireNonGuest(String authorizationHeader) {
        UserAccount userAccount = authService.authenticate(authorizationHeader);
        if (userAccount.getLoginId().startsWith("guest")) {
            throw new ForbiddenException("게스트는 가챠를 이용할 수 없습니다.");
        }
        return userAccount;
    }

    private static boolean isSuperAdmin(UserAccount userAccount) {
        return AuthService.SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId());
    }
}
