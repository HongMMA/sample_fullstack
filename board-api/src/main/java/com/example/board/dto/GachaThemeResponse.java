package com.example.board.dto;

import com.example.board.domain.GachaRarity;

public record GachaThemeResponse(
        String themeCode,
        String displayName,
        int cardCount
) {
}
