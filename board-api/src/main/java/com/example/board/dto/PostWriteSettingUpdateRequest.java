package com.example.board.dto;

import jakarta.validation.constraints.NotNull;

public record PostWriteSettingUpdateRequest(
        @NotNull(message = "enabled 값은 필수입니다.")
        Boolean enabled
) {
}
