package com.example.board.repository;

import com.example.board.domain.GameScore;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameScoreRepository extends JpaRepository<GameScore, Long> {

    List<GameScore> findTop10ByOrderByFinalRoundDescCreatedAtAsc();
}
