package com.example.board.dto;

public record GachaPullItemResponse(
        GachaCardResponse card,
        boolean duplicate
) {
}
