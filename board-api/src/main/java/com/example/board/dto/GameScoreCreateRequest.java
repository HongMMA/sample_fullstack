package com.example.board.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GameScoreCreateRequest(
        @NotNull(message = "최종 라운드는 필수입니다.")
        @Min(value = 1, message = "최종 라운드는 1 이상이어야 합니다.")
        Integer finalRound
) {
}
