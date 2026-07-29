package com.example.board.service;

import com.example.board.domain.AuthToken;
import com.example.board.domain.UserAccount;
import com.example.board.dto.LoginRequest;
import com.example.board.dto.LoginResponse;
import com.example.board.dto.MeResponse;
import com.example.board.exception.UnauthorizedException;
import com.example.board.repository.AuthTokenRepository;
import com.example.board.repository.UserAccountRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final String BEARER_PREFIX = "Bearer ";

    private final UserAccountRepository userAccountRepository;
    private final AuthTokenRepository authTokenRepository;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        UserAccount userAccount = userAccountRepository.findByLoginId(request.loginId().trim())
                .orElseThrow(() -> new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!userAccount.getPassword().equals(request.password())) {
            throw new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        AuthToken authToken = AuthToken.builder()
                .userAccount(userAccount)
                .accessToken(UUID.randomUUID().toString())
                .build();

        authTokenRepository.save(authToken);
        return new LoginResponse(authToken.getAccessToken(), userAccount.getLoginId());
    }

    public MeResponse getMe(String authorizationHeader) {
        UserAccount userAccount = authenticate(authorizationHeader);
        return new MeResponse(userAccount.getId(), userAccount.getLoginId());
    }

    public UserAccount authenticate(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        AuthToken authToken = authTokenRepository.findByAccessToken(token)
                .orElseThrow(() -> new UnauthorizedException());
        Long userId = authToken.getUserAccount().getId();
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException());
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            throw new UnauthorizedException();
        }
        return authorizationHeader.substring(BEARER_PREFIX.length()).trim();
    }
}
