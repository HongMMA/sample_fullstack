package com.example.board.dto;

public record GachaCharacterResponse(
        Long id,
        String themeCode,
        int serialNo,
        String name,
        String artKey,
        String source,
        String imageUrl
) {
}
