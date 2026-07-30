package com.example.board.service;

import com.example.board.domain.GachaCard;
import com.example.board.domain.GachaInventory;
import com.example.board.domain.GachaPlayer;
import com.example.board.domain.GachaRarity;
import com.example.board.domain.UserAccount;
import com.example.board.dto.GachaCardResponse;
import com.example.board.dto.GachaProfileResponse;
import com.example.board.dto.GachaPullItemResponse;
import com.example.board.dto.GachaPullResponse;
import com.example.board.dto.GachaRankingEntryResponse;
import com.example.board.dto.GachaThemeResponse;
import com.example.board.exception.BadRequestException;
import com.example.board.gacha.theme.GachaThemePack;
import com.example.board.gacha.theme.GachaThemeRegistry;
import com.example.board.repository.GachaCardRepository;
import com.example.board.repository.GachaInventoryRepository;
import com.example.board.repository.GachaPlayerRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GachaService {

    private static final int PULL_COST = 1;
    private static final int MAX_PULL_COUNT = 30;
    private static final int RANKING_LIMIT = 10;
    private static final long RANK_BASE = 1_000L;

    /**
     * Probability weights out of 1_000_000.
     * GOAT 0.03%, LEGEND 0.3%, UNIQUE 1%, RARE 5%, MAGIC 10%, NORMAL remainder.
     */
    private static final int[] RARITY_WEIGHTS = {
            836_700, // NORMAL
            100_000, // MAGIC
            50_000,  // RARE
            10_000,  // UNIQUE
            3_000,   // LEGEND
            300      // GOAT
    };

    private static final GachaRarity[] RARITY_ORDER = {
            GachaRarity.NORMAL,
            GachaRarity.MAGIC,
            GachaRarity.RARE,
            GachaRarity.UNIQUE,
            GachaRarity.LEGEND,
            GachaRarity.GOAT
    };

    private final GachaCardRepository gachaCardRepository;
    private final GachaPlayerRepository gachaPlayerRepository;
    private final GachaInventoryRepository gachaInventoryRepository;
    private final GachaThemeRegistry gachaThemeRegistry;

    public GachaThemeResponse getActiveTheme() {
        GachaThemePack pack = gachaThemeRegistry.getActivePack();
        return new GachaThemeResponse(pack.themeCode(), pack.displayName(), pack.expectedCardCount());
    }

    @Transactional
    public GachaProfileResponse getProfile(UserAccount userAccount) {
        GachaPlayer player = getOrCreatePlayer(userAccount);
        return buildProfile(player);
    }

    @Transactional
    public GachaPullResponse pull(UserAccount userAccount, GachaRarity forcedRarity, int count) {
        if (count < 1 || count > MAX_PULL_COUNT) {
            throw new BadRequestException("한 번에 1~" + MAX_PULL_COUNT + "장까지 뽑을 수 있습니다.");
        }
        if (forcedRarity != null && count != 1) {
            throw new BadRequestException("등급 지정 뽑기는 1장만 가능합니다.");
        }

        GachaPlayer player = getOrCreatePlayer(userAccount);
        int totalCost = PULL_COST * count;
        if (player.getPoints() < totalCost) {
            throw new BadRequestException(
                    "포인트가 부족합니다. " + count + "장 뽑기에는 " + totalCost + "포인트가 필요합니다."
            );
        }

        String activeTheme = gachaThemeRegistry.getActivePack().themeCode();
        List<GachaPullItemResponse> results = new ArrayList<>(count);
        GachaCardResponse highlightCard = null;
        int highlightTier = -1;

        for (int i = 0; i < count; i++) {
            GachaRarity rarity = forcedRarity != null ? forcedRarity : rollRarity();
            List<GachaCard> pool = gachaCardRepository.findByThemeCodeAndRarity(activeTheme, rarity);
            if (pool.isEmpty()) {
                throw new BadRequestException("해당 등급의 카드 풀이 비어 있습니다.");
            }

            GachaCard pulled = pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
            boolean duplicate = gachaInventoryRepository
                    .findByPlayerIdAndCardId(player.getId(), pulled.getId())
                    .isPresent();
            addCardToInventory(player, pulled);

            GachaCardResponse cardResponse = toCardResponse(pulled, 1);
            results.add(new GachaPullItemResponse(cardResponse, duplicate));

            int tier = pulled.getRarity().getTier();
            if (tier > highlightTier) {
                highlightTier = tier;
                highlightCard = cardResponse;
            }
        }

        player.spendPoint(totalCost);

        results.sort(Comparator
                .comparingInt((GachaPullItemResponse item) -> item.card().rarity().getTier())
                .reversed()
                .thenComparing(item -> item.card().name()));

        return new GachaPullResponse(highlightCard, results, player.getPoints(), count);
    }

    public List<GachaRankingEntryResponse> getRanking() {
        String activeTheme = gachaThemeRegistry.getActivePack().themeCode();
        List<GachaInventory> inventories = gachaInventoryRepository.findAllWithCardAndPlayer();
        Map<Long, EnumMap<GachaRarity, Integer>> countsByPlayer = new HashMap<>();
        Map<Long, String> loginIdByPlayer = new HashMap<>();

        for (GachaInventory inventory : inventories) {
            if (!activeTheme.equals(inventory.getCard().getThemeCode())) {
                continue;
            }
            Long playerId = inventory.getPlayer().getId();
            loginIdByPlayer.put(playerId, inventory.getPlayer().getUserAccount().getLoginId());
            EnumMap<GachaRarity, Integer> counts = countsByPlayer.computeIfAbsent(
                    playerId,
                    ignored -> new EnumMap<>(GachaRarity.class)
            );
            GachaRarity rarity = inventory.getCard().getRarity();
            counts.merge(rarity, inventory.getQuantity(), Integer::sum);
        }

        List<GachaRankingEntryResponse> ranked = new ArrayList<>();
        for (Map.Entry<Long, EnumMap<GachaRarity, Integer>> entry : countsByPlayer.entrySet()) {
            EnumMap<GachaRarity, Integer> counts = entry.getValue();
            ranked.add(new GachaRankingEntryResponse(
                    0,
                    loginIdByPlayer.get(entry.getKey()),
                    computeRankScore(counts),
                    toRarityCountMap(counts),
                    counts.values().stream().mapToInt(Integer::intValue).sum()
            ));
        }

        ranked.sort(Comparator
                .comparingLong(GachaRankingEntryResponse::score).reversed()
                .thenComparing(GachaRankingEntryResponse::loginId));

        List<GachaRankingEntryResponse> top = new ArrayList<>();
        int limit = Math.min(RANKING_LIMIT, ranked.size());
        for (int i = 0; i < limit; i++) {
            GachaRankingEntryResponse item = ranked.get(i);
            top.add(new GachaRankingEntryResponse(
                    i + 1,
                    item.loginId(),
                    item.score(),
                    item.rarityCounts(),
                    item.totalCards()
            ));
        }
        return top;
    }

    static long computeRankScore(EnumMap<GachaRarity, Integer> counts) {
        return counts.getOrDefault(GachaRarity.GOAT, 0) * pow(RANK_BASE, 5)
                + counts.getOrDefault(GachaRarity.LEGEND, 0) * pow(RANK_BASE, 4)
                + counts.getOrDefault(GachaRarity.UNIQUE, 0) * pow(RANK_BASE, 3)
                + counts.getOrDefault(GachaRarity.RARE, 0) * pow(RANK_BASE, 2)
                + counts.getOrDefault(GachaRarity.MAGIC, 0) * RANK_BASE
                + counts.getOrDefault(GachaRarity.NORMAL, 0);
    }

    private static long pow(long base, int exp) {
        long value = 1L;
        for (int i = 0; i < exp; i++) {
            value *= base;
        }
        return value;
    }

    private GachaProfileResponse buildProfile(GachaPlayer player) {
        String activeTheme = gachaThemeRegistry.getActivePack().themeCode();
        List<GachaInventory> inventories = gachaInventoryRepository.findByPlayerIdOrderByIdAsc(player.getId());
        EnumMap<GachaRarity, Integer> rarityCounts = new EnumMap<>(GachaRarity.class);
        List<GachaCardResponse> cards = new ArrayList<>();

        for (GachaInventory inventory : inventories) {
            GachaCard card = inventory.getCard();
            if (!activeTheme.equals(card.getThemeCode())) {
                continue;
            }
            rarityCounts.merge(card.getRarity(), inventory.getQuantity(), Integer::sum);
            cards.add(toCardResponse(card, inventory.getQuantity()));
        }

        cards.sort(Comparator
                .comparingInt((GachaCardResponse card) -> card.rarity().getTier()).reversed()
                .thenComparing(GachaCardResponse::name));

        return new GachaProfileResponse(
                player.getUserAccount().getLoginId(),
                player.getPoints(),
                cards,
                toRarityCountMap(rarityCounts)
        );
    }

    private GachaCardResponse toCardResponse(GachaCard card, int quantity) {
        return GachaCardResponse.from(
                card,
                quantity,
                gachaThemeRegistry.resolveImageUrl(card.getThemeCode(), card.getArtKey())
        );
    }

    private Map<String, Integer> toRarityCountMap(EnumMap<GachaRarity, Integer> counts) {
        Map<String, Integer> map = new LinkedHashMap<>();
        for (GachaRarity rarity : List.of(
                GachaRarity.GOAT,
                GachaRarity.LEGEND,
                GachaRarity.UNIQUE,
                GachaRarity.RARE,
                GachaRarity.MAGIC,
                GachaRarity.NORMAL
        )) {
            map.put(rarity.name(), counts.getOrDefault(rarity, 0));
        }
        return map;
    }

    private void addCardToInventory(GachaPlayer player, GachaCard card) {
        gachaInventoryRepository.findByPlayerIdAndCardId(player.getId(), card.getId())
                .ifPresentOrElse(
                        inventory -> inventory.addQuantity(1),
                        () -> gachaInventoryRepository.save(GachaInventory.builder()
                                .player(player)
                                .card(card)
                                .quantity(1)
                                .build())
                );
    }

    private GachaPlayer getOrCreatePlayer(UserAccount userAccount) {
        return gachaPlayerRepository.findByUserAccountId(userAccount.getId())
                .orElseGet(() -> gachaPlayerRepository.save(GachaPlayer.builder()
                        .userAccount(userAccount)
                        .points(GachaPlayer.INITIAL_POINTS)
                        .build()));
    }

    private GachaRarity rollRarity() {
        int roll = ThreadLocalRandom.current().nextInt(1_000_000);
        int cumulative = 0;
        for (int i = 0; i < RARITY_ORDER.length; i++) {
            cumulative += RARITY_WEIGHTS[i];
            if (roll < cumulative) {
                return RARITY_ORDER[i];
            }
        }
        return GachaRarity.NORMAL;
    }
}
