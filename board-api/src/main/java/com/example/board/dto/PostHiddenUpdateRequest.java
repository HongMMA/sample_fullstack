package com.example.board.dto;

import jakarta.validation.constraints.NotNull;

public record PostHiddenUpdateRequest(
        @NotNull(message = "hidden 값은 필수입니다.")
        Boolean hidden
) {
}
