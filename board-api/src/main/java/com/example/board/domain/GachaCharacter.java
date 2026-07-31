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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "gacha_characters",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_gacha_characters_theme_serial", columnNames = {"themeCode", "serialNo"}),
                @UniqueConstraint(name = "uk_gacha_characters_theme_art", columnNames = {"themeCode", "artKey"})
        },
        indexes = {
                @Index(name = "idx_gacha_characters_theme", columnList = "themeCode")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GachaCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String themeCode;

    @Column(nullable = false)
    private int serialNo;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 60)
    private String artKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GachaCharacterSource source;

    /**
     * File name under media storage for uploaded characters (e.g. c009.png).
     * Null for classpath/public seed assets.
     */
    @Column(length = 120)
    private String storedFileName;

    @Column(length = 80)
    private String contentType;

    @Builder
    public GachaCharacter(
            String themeCode,
            int serialNo,
            String name,
            String artKey,
            GachaCharacterSource source,
            String storedFileName,
            String contentType
    ) {
        this.themeCode = themeCode;
        this.serialNo = serialNo;
        this.name = name;
        this.artKey = artKey;
        this.source = source;
        this.storedFileName = storedFileName;
        this.contentType = contentType;
    }

    public boolean isUploaded() {
        return source == GachaCharacterSource.UPLOAD;
    }
}
