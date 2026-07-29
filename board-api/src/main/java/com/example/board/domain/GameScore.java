package com.example.board.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "game_scores")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GameScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String playerName;

    @Column(nullable = false)
    private Integer finalRound;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public GameScore(String playerName, Integer finalRound) {
        this.playerName = playerName;
        this.finalRound = finalRound;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
