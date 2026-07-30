package com.example.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "아이디는 필수입니다.")
        @Size(max = 30, message = "아이디는 30자 이하여야 합니다.")
        String loginId,

        @NotBlank(message = "비밀번호는 필수입니다.")
        @Size(max = 100, message = "비밀번호는 100자 이하여야 합니다.")
        String password,

        @NotBlank(message = "비밀번호 확인은 필수입니다.")
        String passwordConfirm
) {
}
