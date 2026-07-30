package com.example.board.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "gacha_players")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GachaPlayer {

    public static final int INITIAL_POINTS = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_account_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private UserAccount userAccount;

    @Column(nullable = false)
    private int points;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public GachaPlayer(UserAccount userAccount, int points) {
        this.userAccount = userAccount;
        this.points = points;
    }

    public void spendPoint(int amount) {
        this.points -= amount;
        this.updatedAt = LocalDateTime.now();
    }

    public void addPoints(int amount) {
        this.points += amount;
        this.updatedAt = LocalDateTime.now();
    }

    public void resetPoints(int points) {
        this.points = points;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
