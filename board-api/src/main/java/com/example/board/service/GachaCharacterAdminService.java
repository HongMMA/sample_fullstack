package com.example.board.service;

import com.example.board.config.GachaCatalogSeeder;
import com.example.board.domain.GachaCharacter;
import com.example.board.domain.GachaCharacterSource;
import com.example.board.dto.GachaCharacterResponse;
import com.example.board.exception.BadRequestException;
import com.example.board.gacha.theme.DktThemePack;
import com.example.board.gacha.theme.GachaThemeRegistry;
import com.example.board.repository.GachaCharacterRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class GachaCharacterAdminService {

    private final GachaCharacterRepository gachaCharacterRepository;
    private final GachaMediaStorageService gachaMediaStorageService;
    private final GachaCatalogSeeder gachaCatalogSeeder;
    private final GachaThemeRegistry gachaThemeRegistry;
    private final ObjectMapper objectMapper;

    @Transactional
    public void syncDktSeedCharacters() {
        List<SeedCharacter> seeds = loadDktSeeds();
        for (SeedCharacter seed : seeds) {
            if (gachaCharacterRepository.existsByThemeCodeAndArtKey(DktThemePack.THEME_CODE, seed.artKey())) {
                continue;
            }
            gachaCharacterRepository.save(GachaCharacter.builder()
                    .themeCode(DktThemePack.THEME_CODE)
                    .serialNo(seed.serialNo())
                    .name(seed.name())
                    .artKey(seed.artKey())
                    .source(GachaCharacterSource.SEED)
                    .build());
        }
    }

    @Transactional(readOnly = true)
    public List<GachaCharacterResponse> listDktCharacters() {
        return gachaCharacterRepository.findByThemeCodeOrderBySerialNoAsc(DktThemePack.THEME_CODE).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public GachaCharacterResponse uploadDktCharacter(String name, MultipartFile image) {
        String trimmedName = name == null ? "" : name.trim();
        if (trimmedName.isEmpty() || trimmedName.length() > 40) {
            throw new BadRequestException("캐릭터 이름은 1~40자여야 합니다.");
        }

        int nextSerial = gachaCharacterRepository.findMaxSerialNoByThemeCode(DktThemePack.THEME_CODE) + 1;
        String artKey = "c" + String.format("%03d", nextSerial);
        if (gachaCharacterRepository.existsByThemeCodeAndArtKey(DktThemePack.THEME_CODE, artKey)) {
            throw new BadRequestException("캐릭터 키가 중복됩니다. 다시 시도해 주세요.");
        }

        GachaMediaStorageService.StoredImage stored =
                gachaMediaStorageService.store(DktThemePack.THEME_CODE, artKey, image);

        GachaCharacter character = gachaCharacterRepository.save(GachaCharacter.builder()
                .themeCode(DktThemePack.THEME_CODE)
                .serialNo(nextSerial)
                .name(trimmedName)
                .artKey(artKey)
                .source(GachaCharacterSource.UPLOAD)
                .storedFileName(stored.storedFileName())
                .contentType(stored.contentType())
                .build());

        gachaCatalogSeeder.ensureThemeCatalog(gachaThemeRegistry.requirePack(DktThemePack.THEME_CODE));
        return toResponse(character);
    }

    public String resolveImageUrl(GachaCharacter character) {
        if (character.isUploaded() && character.getStoredFileName() != null) {
            return "/api/gacha/media/" + character.getThemeCode() + "/" + character.getStoredFileName();
        }
        return "/gacha/dkt/" + character.getArtKey() + ".png";
    }

    public String resolveImageUrl(String themeCode, String artKey) {
        if (!DktThemePack.THEME_CODE.equals(themeCode) || artKey == null || artKey.isBlank()) {
            return null;
        }
        return gachaCharacterRepository.findByThemeCodeAndArtKey(themeCode, artKey)
                .map(this::resolveImageUrl)
                .orElse("/gacha/dkt/" + artKey + ".png");
    }

    private GachaCharacterResponse toResponse(GachaCharacter character) {
        return new GachaCharacterResponse(
                character.getId(),
                character.getThemeCode(),
                character.getSerialNo(),
                character.getName(),
                character.getArtKey(),
                character.getSource().name(),
                resolveImageUrl(character)
        );
    }

    private List<SeedCharacter> loadDktSeeds() {
        try (InputStream inputStream = new ClassPathResource("gacha/dkt-characters.json").getInputStream()) {
            List<SeedCharacter> loaded = objectMapper.readValue(inputStream, new TypeReference<>() {
            });
            if (loaded == null || loaded.isEmpty()) {
                throw new IllegalStateException("dkt-characters.json is empty");
            }
            return loaded;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load dkt-characters.json", ex);
        }
    }

    private record SeedCharacter(int serialNo, String name, String artKey) {
    }
}
