package com.example.board.service;

import com.example.board.domain.GameScore;
import com.example.board.domain.UserAccount;
import com.example.board.dto.GameScoreCreateRequest;
import com.example.board.dto.GameScoreResponse;
import com.example.board.repository.GameScoreRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GameScoreService {

    private final GameScoreRepository gameScoreRepository;

    @Transactional
    public GameScoreResponse create(UserAccount userAccount, GameScoreCreateRequest request) {
        GameScore score = GameScore.builder()
                .playerName(userAccount.getLoginId())
                .finalRound(request.finalRound())
                .build();
        GameScore saved = gameScoreRepository.save(score);
        return GameScoreResponse.from(saved, 0);
    }

    public List<GameScoreResponse> findRanking() {
        List<GameScore> scores = gameScoreRepository.findTop10ByOrderByFinalRoundDescCreatedAtAsc();
        AtomicInteger rank = new AtomicInteger(1);
        List<GameScoreResponse> ranking = new ArrayList<>(scores.size());
        for (GameScore score : scores) {
            ranking.add(GameScoreResponse.from(score, rank.getAndIncrement()));
        }
        return ranking;
    }
}
