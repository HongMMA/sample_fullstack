package com.example.board.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "gacha_cards",
        indexes = {
                @Index(name = "idx_gacha_cards_rarity", columnList = "rarity"),
                @Index(name = "idx_gacha_cards_theme", columnList = "themeCode")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GachaCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    /**
     * Theme pack identifier (e.g. animal, sword). Can be swapped later without schema changes.
     */
    @Column(nullable = false, length = 40)
    private String themeCode;

    /**
     * Theme-local art key used by the frontend skin layer.
     */
    @Column(nullable = false, length = 60)
    private String artKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GachaRarity rarity;

    @Column(nullable = false)
    private int serialNo;

    @Builder
    public GachaCard(String code, String name, String themeCode, String artKey, GachaRarity rarity, int serialNo) {
        this.code = code;
        this.name = name;
        this.themeCode = themeCode;
        this.artKey = artKey;
        this.rarity = rarity;
        this.serialNo = serialNo;
    }
}
