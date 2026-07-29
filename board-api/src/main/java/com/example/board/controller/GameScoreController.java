package com.example.board.controller;

import com.example.board.dto.GameScoreCreateRequest;
import com.example.board.dto.GameScoreResponse;
import com.example.board.service.AuthService;
import com.example.board.service.GameScoreService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game/scores")
@RequiredArgsConstructor
public class GameScoreController {

    private final AuthService authService;
    private final GameScoreService gameScoreService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GameScoreResponse create(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody GameScoreCreateRequest request
    ) {
        return gameScoreService.create(authService.authenticate(authorizationHeader), request);
    }

    @GetMapping
    public List<GameScoreResponse> findRanking() {
        return gameScoreService.findRanking();
    }
}
