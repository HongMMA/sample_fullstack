package com.example.board.dto;

import java.util.List;

public record GachaPullResponse(
        GachaCardResponse highlightCard,
        List<GachaPullItemResponse> results,
        int remainingPoints,
        int pullCount
) {
}
