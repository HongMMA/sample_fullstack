package com.example.board.dto;

import com.example.board.domain.GachaRarity;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record GachaPullRequest(
        GachaRarity rarity,
        @Min(value = 1, message = "count는 1 이상이어야 합니다.")
        @Max(value = 30, message = "count는 30 이하여야 합니다.")
        Integer count
) {
}
