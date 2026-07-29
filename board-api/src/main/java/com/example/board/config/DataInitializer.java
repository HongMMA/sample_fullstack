package com.example.board.config;

import com.example.board.domain.UserAccount;
import com.example.board.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserAccountRepository userAccountRepository;

    @Bean
    public CommandLineRunner seedUsers() {
        return args -> {
            createUserIfMissing("player1", "1234");
            createUserIfMissing("player2", "1234");
        };
    }

    private void createUserIfMissing(String loginId, String password) {
        if (userAccountRepository.findByLoginId(loginId).isPresent()) {
            return;
        }
        userAccountRepository.save(UserAccount.builder()
                .loginId(loginId)
                .password(password)
                .build());
    }
}
