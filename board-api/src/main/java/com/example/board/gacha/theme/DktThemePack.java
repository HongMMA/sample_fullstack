package com.example.board.gacha.theme;

import com.example.board.domain.GachaCharacter;
import com.example.board.domain.GachaRarity;
import com.example.board.repository.GachaCharacterRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * DKT theme pack.
 * Characters live in {@code gacha_characters} (seeded from classpath JSON, then admin uploads).
 * Seed images: {@code /gacha/dkt/{artKey}.png} (board-web/public).
 * Uploaded images: {@code /api/gacha/media/dkt/{fileName}} (API disk storage).
 */
@Component
@RequiredArgsConstructor
public class DktThemePack implements GachaThemePack {

    public static final String THEME_CODE = "dkt";

    private final GachaCharacterRepository gachaCharacterRepository;

    @Override
    public String themeCode() {
        return THEME_CODE;
    }

    @Override
    public String displayName() {
        return "DKT";
    }

    @Override
    public List<CardDefinition> definitions() {
        List<GachaCharacter> characters =
                gachaCharacterRepository.findByThemeCodeOrderBySerialNoAsc(THEME_CODE);
        List<CardDefinition> list = new ArrayList<>(characters.size() * GachaRarity.values().length);
        for (GachaRarity rarity : GachaRarity.values()) {
            for (GachaCharacter character : characters) {
                list.add(new CardDefinition(
                        "DKT-" + String.format("%03d", character.getSerialNo()) + "-" + rarity.name(),
                        character.getName(),
                        character.getArtKey(),
                        rarity,
                        character.getSerialNo()
                ));
            }
        }
        return list;
    }

    @Override
    public String resolveImageUrl(String artKey) {
        if (artKey == null || artKey.isBlank()) {
            return null;
        }
        return gachaCharacterRepository.findByThemeCodeAndArtKey(THEME_CODE, artKey)
                .map(character -> {
                    if (character.isUploaded() && character.getStoredFileName() != null) {
                        return "/api/gacha/media/" + THEME_CODE + "/" + character.getStoredFileName();
                    }
                    return "/gacha/dkt/" + character.getArtKey() + ".png";
                })
                .orElse("/gacha/dkt/" + artKey + ".png");
    }
}
