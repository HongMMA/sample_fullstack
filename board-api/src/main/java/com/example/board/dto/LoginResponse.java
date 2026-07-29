package com.example.board.dto;

public record LoginResponse(
        String accessToken,
        String loginId
) {
}
