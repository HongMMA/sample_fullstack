package com.example.board.dto;

public record GachaThemeOptionResponse(
        String themeCode,
        String displayName,
        int cardCount,
        boolean active
) {
}
