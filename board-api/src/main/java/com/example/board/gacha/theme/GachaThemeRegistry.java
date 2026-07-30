package com.example.board.gacha.theme;

import com.example.board.domain.AppSetting;
import com.example.board.exception.BadRequestException;
import com.example.board.repository.AppSettingRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GachaThemeRegistry {

    public static final String ACTIVE_THEME_SETTING_KEY = "GACHA_ACTIVE_THEME";

    private final List<GachaThemePack> packs;
    private final AppSettingRepository appSettingRepository;

    public GachaThemePack getActivePack() {
        String themeCode = appSettingRepository.findBySettingKey(ACTIVE_THEME_SETTING_KEY)
                .map(AppSetting::getSettingValue)
                .orElse(PokemonGen1ThemePack.THEME_CODE);
        return requirePack(themeCode);
    }

    public GachaThemePack requirePack(String themeCode) {
        GachaThemePack pack = asMap().get(themeCode);
        if (pack == null) {
            throw new BadRequestException("등록되지 않은 가챠 테마입니다: " + themeCode);
        }
        return pack;
    }

    public GachaThemePack findPackOrNull(String themeCode) {
        return asMap().get(themeCode);
    }

    public String resolveImageUrl(String themeCode, String artKey) {
        GachaThemePack pack = findPackOrNull(themeCode);
        if (pack == null) {
            return null;
        }
        return pack.resolveImageUrl(artKey);
    }

    public List<GachaThemePack> allPacks() {
        return List.copyOf(packs);
    }

    private Map<String, GachaThemePack> asMap() {
        return packs.stream().collect(Collectors.toMap(GachaThemePack::themeCode, Function.identity()));
    }
}
