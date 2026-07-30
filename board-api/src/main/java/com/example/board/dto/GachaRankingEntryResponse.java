package com.example.board.dto;

import java.util.Map;

public record GachaRankingEntryResponse(
        int rank,
        String loginId,
        long score,
        Map<String, Integer> rarityCounts,
        int totalCards
) {
}
