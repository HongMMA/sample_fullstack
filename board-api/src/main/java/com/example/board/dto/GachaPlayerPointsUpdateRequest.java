package com.example.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GachaPlayerPointsUpdateRequest(
        @NotBlank(message = "loginId는 필수입니다.")
        String loginId,
        @NotNull(message = "delta는 필수입니다.")
        Integer delta
) {
}
