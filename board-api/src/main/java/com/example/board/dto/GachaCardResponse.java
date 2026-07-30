package com.example.board.dto;

import com.example.board.domain.GachaCard;
import com.example.board.domain.GachaRarity;

public record GachaCardResponse(
        Long id,
        String code,
        String name,
        String themeCode,
        String artKey,
        String imageUrl,
        GachaRarity rarity,
        String rarityLabel,
        int serialNo,
        int quantity
) {
    public static GachaCardResponse from(GachaCard card, int quantity, String imageUrl) {
        return new GachaCardResponse(
                card.getId(),
                card.getCode(),
                card.getName(),
                card.getThemeCode(),
                card.getArtKey(),
                imageUrl,
                card.getRarity(),
                card.getRarity().getLabel(),
                card.getSerialNo(),
                quantity
        );
    }
}
