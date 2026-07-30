package com.example.board.repository;

import com.example.board.domain.GachaInventory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GachaInventoryRepository extends JpaRepository<GachaInventory, Long> {

    @Query("""
            select i from GachaInventory i
            join fetch i.card
            where i.player.id = :playerId
            order by i.id asc
            """)
    List<GachaInventory> findByPlayerIdOrderByIdAsc(@Param("playerId") Long playerId);

    Optional<GachaInventory> findByPlayerIdAndCardId(Long playerId, Long cardId);

    @Query("""
            select i from GachaInventory i
            join fetch i.card
            join fetch i.player p
            join fetch p.userAccount
            """)
    List<GachaInventory> findAllWithCardAndPlayer();
}
