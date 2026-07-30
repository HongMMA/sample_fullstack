package com.example.board.dto;

public record GachaPullResponse(
        GachaCardResponse pulledCard,
        int remainingPoints,
        boolean duplicate
) {
}
