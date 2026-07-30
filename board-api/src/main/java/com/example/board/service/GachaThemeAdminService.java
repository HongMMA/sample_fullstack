package com.example.board.service;

import com.example.board.domain.AppSetting;
import com.example.board.dto.GachaThemeOptionResponse;
import com.example.board.dto.GachaThemeResponse;
import com.example.board.gacha.theme.GachaThemePack;
import com.example.board.gacha.theme.GachaThemeRegistry;
import com.example.board.config.GachaCatalogSeeder;
import com.example.board.repository.AppSettingRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GachaThemeAdminService {

    private final GachaThemeRegistry gachaThemeRegistry;
    private final AppSettingRepository appSettingRepository;
    private final GachaCatalogSeeder gachaCatalogSeeder;

    public List<GachaThemeOptionResponse> listThemes() {
        String activeCode = gachaThemeRegistry.getActivePack().themeCode();
        return gachaThemeRegistry.allPacks().stream()
                .map(pack -> new GachaThemeOptionResponse(
                        pack.themeCode(),
                        pack.displayName(),
                        pack.expectedCardCount(),
                        pack.themeCode().equals(activeCode)
                ))
                .toList();
    }

    @Transactional
    public GachaThemeResponse switchTheme(String themeCode) {
        GachaThemePack pack = gachaThemeRegistry.requirePack(themeCode.trim());

        AppSetting setting = appSettingRepository.findBySettingKey(GachaThemeRegistry.ACTIVE_THEME_SETTING_KEY)
                .orElseGet(() -> AppSetting.builder()
                        .settingKey(GachaThemeRegistry.ACTIVE_THEME_SETTING_KEY)
                        .settingValue(pack.themeCode())
                        .build());
        setting.updateValue(pack.themeCode());
        appSettingRepository.save(setting);

        gachaCatalogSeeder.activateTheme(pack);

        return new GachaThemeResponse(pack.themeCode(), pack.displayName(), pack.expectedCardCount());
    }
}
