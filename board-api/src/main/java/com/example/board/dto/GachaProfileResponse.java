package com.example.board.dto;

import java.util.List;
import java.util.Map;

public record GachaProfileResponse(
        String loginId,
        int points,
        List<GachaCardResponse> cards,
        Map<String, Integer> rarityCounts
) {
}
