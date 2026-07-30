package com.example.board.dto;

import jakarta.validation.constraints.NotBlank;

public record GachaThemeUpdateRequest(
        @NotBlank(message = "themeCode는 필수입니다.")
        String themeCode
) {
}
