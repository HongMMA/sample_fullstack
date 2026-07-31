package com.example.board.config;

import com.example.board.domain.GachaCard;
import com.example.board.domain.GachaInventory;
import com.example.board.domain.GachaPlayer;
import com.example.board.domain.GachaRarity;
import com.example.board.domain.UserAccount;
import com.example.board.gacha.theme.GachaThemePack;
import com.example.board.gacha.theme.GachaThemeRegistry;
import com.example.board.repository.GachaCardRepository;
import com.example.board.repository.GachaInventoryRepository;
import com.example.board.repository.GachaPlayerRepository;
import com.example.board.repository.UserAccountRepository;
import com.example.board.service.AuthService;
import com.example.board.service.GachaCharacterAdminService;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class GachaCatalogSeeder {

    private final GachaCardRepository gachaCardRepository;
    private final UserAccountRepository userAccountRepository;
    private final GachaPlayerRepository gachaPlayerRepository;
    private final GachaInventoryRepository gachaInventoryRepository;
    private final GachaThemeRegistry gachaThemeRegistry;
    private final ObjectProvider<GachaCharacterAdminService> gachaCharacterAdminService;

    @Transactional
    public void seedIfNeeded() {
        gachaCharacterAdminService.getObject().syncDktSeedCharacters();
        for (GachaThemePack pack : gachaThemeRegistry.allPacks()) {
            ensureThemeCatalog(pack);
        }
        seedSuperAdminOneOfEachRarity();
    }

    /**
     * Activates a theme for pulls without wiping inventories or other theme catalogs.
     */
    @Transactional
    public void activateTheme(GachaThemePack pack) {
        ensureThemeCatalog(pack);
    }

    /**
     * Upserts missing cards for a theme. Never deletes inventory or existing cards.
     */
    @Transactional
    public void ensureThemeCatalog(GachaThemePack pack) {
        Set<String> existingCodes = gachaCardRepository.findByThemeCode(pack.themeCode()).stream()
                .map(GachaCard::getCode)
                .collect(Collectors.toCollection(HashSet::new));

        List<GachaCard> batch = new ArrayList<>();
        for (GachaThemePack.CardDefinition definition : pack.definitions()) {
            if (existingCodes.contains(definition.code())) {
                continue;
            }
            batch.add(GachaCard.builder()
                    .code(definition.code())
                    .name(definition.name())
                    .themeCode(pack.themeCode())
                    .artKey(definition.artKey())
                    .rarity(definition.rarity())
                    .serialNo(definition.serialNo())
                    .build());
            if (batch.size() >= 100) {
                gachaCardRepository.saveAll(batch);
                batch.clear();
            }
        }
        if (!batch.isEmpty()) {
            gachaCardRepository.saveAll(batch);
        }
    }

    private void seedSuperAdminOneOfEachRarity() {
        UserAccount superAdmin = userAccountRepository.findByLoginId(AuthService.SUPERADMIN_LOGIN_ID)
                .orElse(null);
        if (superAdmin == null) {
            return;
        }

        GachaPlayer player = gachaPlayerRepository.findByUserAccountId(superAdmin.getId())
                .orElseGet(() -> gachaPlayerRepository.save(GachaPlayer.builder()
                        .userAccount(superAdmin)
                        .points(GachaPlayer.INITIAL_POINTS)
                        .build()));

        String activeTheme = gachaThemeRegistry.getActivePack().themeCode();
        Set<GachaRarity> ownedRarities = EnumSet.noneOf(GachaRarity.class);
        for (GachaInventory inventory : gachaInventoryRepository.findByPlayerIdOrderByIdAsc(player.getId())) {
            if (activeTheme.equals(inventory.getCard().getThemeCode())) {
                ownedRarities.add(inventory.getCard().getRarity());
            }
        }

        for (GachaRarity rarity : GachaRarity.values()) {
            if (ownedRarities.contains(rarity)) {
                continue;
            }
            List<GachaCard> pool = gachaCardRepository.findByThemeCodeAndRarity(activeTheme, rarity);
            GachaCard starter = pool.stream()
                    .filter(card -> card.getSerialNo() == 1)
                    .findFirst()
                    .orElseGet(() -> pool.isEmpty() ? null : pool.getFirst());
            if (starter == null) {
                continue;
            }
            gachaInventoryRepository.save(GachaInventory.builder()
                    .player(player)
                    .card(starter)
                    .quantity(1)
                    .build());
        }
    }
}
