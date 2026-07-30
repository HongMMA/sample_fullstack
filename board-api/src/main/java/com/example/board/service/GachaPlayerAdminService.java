package com.example.board.service;

import com.example.board.domain.GachaPlayer;
import com.example.board.domain.UserAccount;
import com.example.board.dto.GachaPlayerPointsResponse;
import com.example.board.exception.BadRequestException;
import com.example.board.repository.GachaPlayerRepository;
import com.example.board.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GachaPlayerAdminService {

    private final UserAccountRepository userAccountRepository;
    private final GachaPlayerRepository gachaPlayerRepository;

    public GachaPlayerPointsResponse getPlayerPoints(String loginId) {
        UserAccount userAccount = findMember(loginId);
        GachaPlayer player = gachaPlayerRepository.findByUserAccountId(userAccount.getId())
                .orElse(null);
        return new GachaPlayerPointsResponse(
                userAccount.getLoginId(),
                player != null ? player.getPoints() : 0
        );
    }

    @Transactional
    public GachaPlayerPointsResponse adjustPlayerPoints(String loginId, int delta) {
        if (delta == 0) {
            throw new BadRequestException("변경할 포인트(delta)는 0이 아니어야 합니다.");
        }

        UserAccount userAccount = findMember(loginId);
        GachaPlayer player = gachaPlayerRepository.findByUserAccountId(userAccount.getId())
                .orElseGet(() -> gachaPlayerRepository.save(GachaPlayer.builder()
                        .userAccount(userAccount)
                        .points(0)
                        .build()));

        int next = player.getPoints() + delta;
        if (next < 0) {
            throw new BadRequestException("포인트는 0 미만으로 내릴 수 없습니다. (현재 " + player.getPoints() + ")");
        }
        player.resetPoints(next);
        return new GachaPlayerPointsResponse(userAccount.getLoginId(), player.getPoints());
    }

    private UserAccount findMember(String loginId) {
        String normalized = loginId == null ? "" : loginId.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("loginId는 필수입니다.");
        }
        if (normalized.startsWith("guest")) {
            throw new BadRequestException("게스트 계정에는 포인트를 지급할 수 없습니다.");
        }
        return userAccountRepository.findByLoginId(normalized)
                .orElseThrow(() -> new BadRequestException("사용자를 찾을 수 없습니다: " + normalized));
    }
}
