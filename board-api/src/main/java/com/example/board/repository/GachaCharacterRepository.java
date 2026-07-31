package com.example.board.repository;

import com.example.board.domain.GachaCharacter;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GachaCharacterRepository extends JpaRepository<GachaCharacter, Long> {

    List<GachaCharacter> findByThemeCodeOrderBySerialNoAsc(String themeCode);

    Optional<GachaCharacter> findByThemeCodeAndArtKey(String themeCode, String artKey);

    boolean existsByThemeCodeAndArtKey(String themeCode, String artKey);

    @Query("select coalesce(max(c.serialNo), 0) from GachaCharacter c where c.themeCode = :themeCode")
    int findMaxSerialNoByThemeCode(@Param("themeCode") String themeCode);
}
