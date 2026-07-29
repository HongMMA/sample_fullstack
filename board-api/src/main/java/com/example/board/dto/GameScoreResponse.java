package com.example.board.dto;

import com.example.board.domain.GameScore;
import java.time.LocalDateTime;

public record GameScoreResponse(
        Long id,
        String playerName,
        Integer finalRound,
        Integer rank,
        LocalDateTime createdAt
) {
    public static GameScoreResponse from(GameScore score, int rank) {
        return new GameScoreResponse(
                score.getId(),
                score.getPlayerName(),
                score.getFinalRound(),
                rank,
                score.getCreatedAt()
        );
    }
}
