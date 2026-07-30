package com.example.board.service;

import com.example.board.domain.AuthToken;
import com.example.board.domain.UserAccount;
import com.example.board.dto.LoginRequest;
import com.example.board.dto.LoginResponse;
import com.example.board.dto.MeResponse;
import com.example.board.dto.SignupRequest;
import com.example.board.exception.BadRequestException;
import com.example.board.exception.ForbiddenException;
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
    public static final String SUPERADMIN_LOGIN_ID = "superadmin";

    private final UserAccountRepository userAccountRepository;
    private final AuthTokenRepository authTokenRepository;

    @Transactional
    public LoginResponse signup(SignupRequest request, String clientIp) {
        String loginId = request.loginId().trim();

        if (!request.password().equals(request.passwordConfirm())) {
            throw new BadRequestException("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }

        if (SUPERADMIN_LOGIN_ID.equalsIgnoreCase(loginId)) {
            throw new BadRequestException("사용할 수 없는 아이디입니다.");
        }

        String lowerLoginId = loginId.toLowerCase();
        if (lowerLoginId.contains("hoon") || loginId.contains("훈")) {
            throw new BadRequestException("부적절한 단어가 포함되어있습니다.");
        }

        if (userAccountRepository.existsByLoginId(loginId)) {
            throw new BadRequestException("이미 사용 중인 아이디입니다.");
        }

        UserAccount userAccount = userAccountRepository.save(
                UserAccount.builder()
                        .loginId(loginId)
                        .password(request.password())
                        .signupIp(clientIp)
                        .build()
        );

        return issueToken(userAccount);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        UserAccount userAccount = userAccountRepository.findByLoginId(request.loginId().trim())
                .orElseThrow(() -> new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!userAccount.getPassword().equals(request.password())) {
            throw new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        return issueToken(userAccount);
    }

    @Transactional
    public LoginResponse loginAsGuest(String clientIp) {
        String loginId;
        do {
            loginId = "guest" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        } while (userAccountRepository.existsByLoginId(loginId));

        UserAccount userAccount = userAccountRepository.save(
                UserAccount.builder()
                        .loginId(loginId)
                        .password(UUID.randomUUID().toString())
                        .signupIp(clientIp)
                        .build()
        );

        return issueToken(userAccount);
    }

    private LoginResponse issueToken(UserAccount userAccount) {
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

    public UserAccount requireSuperAdmin(String authorizationHeader) {
        UserAccount userAccount = authenticate(authorizationHeader);
        if (!SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId())) {
            throw new ForbiddenException("superadmin만 사용할 수 있는 기능입니다.");
        }
        return userAccount;
    }

    public boolean isSuperAdmin(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return false;
        }
        try {
            UserAccount userAccount = authenticate(authorizationHeader);
            return SUPERADMIN_LOGIN_ID.equals(userAccount.getLoginId());
        } catch (UnauthorizedException ex) {
            return false;
        }
    }

    public String findLoginIdOrNull(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }
        try {
            return authenticate(authorizationHeader).getLoginId();
        } catch (UnauthorizedException ex) {
            return null;
        }
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            throw new UnauthorizedException();
        }
        return authorizationHeader.substring(BEARER_PREFIX.length()).trim();
    }
}
