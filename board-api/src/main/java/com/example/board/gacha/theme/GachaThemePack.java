package com.example.board.gacha.theme;

import com.example.board.domain.GachaRarity;
import java.util.List;

/**
 * Pluggable gacha theme pack.
 * To switch character types later:
 * 1) Implement this interface (e.g. AnimeHeroThemePack)
 * 2) Register it in {@link GachaThemeRegistry}
 * 3) Set app setting {@code GACHA_ACTIVE_THEME} to the new themeCode (admin API)
 * 4) Catalog for that pack is ensured; inventories from other themes are kept
 */
public interface GachaThemePack {

    String themeCode();

    String displayName();

    List<CardDefinition> definitions();

    String resolveImageUrl(String artKey);

    default int expectedCardCount() {
        return definitions().size();
    }

    record CardDefinition(
            String code,
            String name,
            String artKey,
            GachaRarity rarity,
            int serialNo
    ) {
    }
}
