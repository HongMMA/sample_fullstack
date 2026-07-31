package com.example.board.controller;

import com.example.board.dto.GachaCharacterResponse;
import com.example.board.dto.GachaPlayerPointsResponse;
import com.example.board.dto.GachaPlayerPointsUpdateRequest;
import com.example.board.dto.GachaThemeOptionResponse;
import com.example.board.dto.GachaThemeResponse;
import com.example.board.dto.GachaThemeUpdateRequest;
import com.example.board.exception.BadRequestException;
import com.example.board.service.AuthService;
import com.example.board.service.GachaCharacterAdminService;
import com.example.board.service.GachaPlayerAdminService;
import com.example.board.service.GachaThemeAdminService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/gacha")
@RequiredArgsConstructor
public class GachaAdminController {

    private final GachaThemeAdminService gachaThemeAdminService;
    private final GachaPlayerAdminService gachaPlayerAdminService;
    private final GachaCharacterAdminService gachaCharacterAdminService;
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

    @GetMapping("/player-points")
    public GachaPlayerPointsResponse getPlayerPoints(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam("loginId") String loginId
    ) {
        authService.requireSuperAdmin(authorizationHeader);
        return gachaPlayerAdminService.getPlayerPoints(loginId);
    }

    @PutMapping("/player-points")
    public GachaPlayerPointsResponse adjustPlayerPoints(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody GachaPlayerPointsUpdateRequest request
    ) {
        authService.requireSuperAdmin(authorizationHeader);
        return gachaPlayerAdminService.adjustPlayerPoints(request.loginId(), request.delta());
    }

    @GetMapping("/characters")
    public List<GachaCharacterResponse> listCharacters(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam(value = "themeCode", defaultValue = "dkt") String themeCode
    ) {
        authService.requireSuperAdmin(authorizationHeader);
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
        authService.requireSuperAdmin(authorizationHeader);
        if (!"dkt".equals(themeCode)) {
            throw new BadRequestException("현재는 DKT 테마만 캐릭터 업로드를 지원합니다.");
        }
        return gachaCharacterAdminService.uploadDktCharacter(name, image);
    }
}
