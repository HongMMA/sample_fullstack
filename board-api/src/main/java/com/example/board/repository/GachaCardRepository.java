package com.example.board.repository;

import com.example.board.domain.GachaCard;
import com.example.board.domain.GachaRarity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GachaCardRepository extends JpaRepository<GachaCard, Long> {

    long countByThemeCode(String themeCode);

    List<GachaCard> findByThemeCode(String themeCode);

    List<GachaCard> findByThemeCodeAndRarity(String themeCode, GachaRarity rarity);
}
