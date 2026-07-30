package com.example.board.repository;

import com.example.board.domain.GachaPlayer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GachaPlayerRepository extends JpaRepository<GachaPlayer, Long> {

    @Query("""
            select p from GachaPlayer p
            join fetch p.userAccount
            where p.userAccount.id = :userAccountId
            """)
    Optional<GachaPlayer> findByUserAccountId(@Param("userAccountId") Long userAccountId);
}
