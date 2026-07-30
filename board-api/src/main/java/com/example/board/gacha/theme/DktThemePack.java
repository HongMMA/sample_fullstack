package com.example.board.gacha.theme;

import com.example.board.domain.GachaRarity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * DKT theme pack.
 * Characters are loaded from {@code classpath:gacha/dkt-characters.json}.
 * Images are expected at the web app path {@code /gacha/dkt/{artKey}.png}
 * (place files under {@code board-web/public/gacha/dkt/}).
 * Each character is generated for every rarity automatically.
 */
@Component
public class DktThemePack implements GachaThemePack {

    public static final String THEME_CODE = "dkt";

    private final List<CharacterSeed> characters;

    public DktThemePack(ObjectMapper objectMapper) {
        this.characters = loadCharacters(objectMapper);
    }

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
        List<CardDefinition> list = new ArrayList<>(characters.size() * GachaRarity.values().length);
        for (GachaRarity rarity : GachaRarity.values()) {
            for (CharacterSeed character : characters) {
                list.add(new CardDefinition(
                        "DKT-" + String.format("%03d", character.serialNo()) + "-" + rarity.name(),
                        character.name(),
                        character.artKey(),
                        rarity,
                        character.serialNo()
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
        return "/gacha/dkt/" + artKey + ".png";
    }

    private List<CharacterSeed> loadCharacters(ObjectMapper objectMapper) {
        try (InputStream inputStream = new ClassPathResource("gacha/dkt-characters.json").getInputStream()) {
            List<CharacterSeed> loaded = objectMapper.readValue(inputStream, new TypeReference<>() {
            });
            if (loaded == null || loaded.isEmpty()) {
                throw new IllegalStateException("dkt-characters.json is empty");
            }
            return List.copyOf(loaded);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load dkt-characters.json", ex);
        }
    }

    public record CharacterSeed(int serialNo, String name, String artKey) {
    }
}
