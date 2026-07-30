package com.example.board.config;

import com.example.board.domain.AppSetting;
import com.example.board.domain.UserAccount;
import com.example.board.gacha.theme.GachaThemeRegistry;
import com.example.board.gacha.theme.PokemonGen1ThemePack;
import com.example.board.repository.AppSettingRepository;
import com.example.board.repository.UserAccountRepository;
import com.example.board.service.AppSettingService;
import com.example.board.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserAccountRepository userAccountRepository;
    private final AppSettingRepository appSettingRepository;
    private final GachaCatalogSeeder gachaCatalogSeeder;

    @Bean
    public CommandLineRunner seedUsers() {
        return args -> {
            createUserIfMissing("player1", "1234");
            createUserIfMissing("player2", "1234");
            ensureSuperAdmin(AuthService.SUPERADMIN_LOGIN_ID, "superadmin");
            createSettingIfMissing(AppSettingService.POST_WRITE_ENABLED_KEY, "true");
            createSettingIfMissing(AppSettingService.GACHA_ENABLED_KEY, "false");
            // Change this value (and register a new GachaThemePack) to switch character types.
            createSettingIfMissing(GachaThemeRegistry.ACTIVE_THEME_SETTING_KEY, PokemonGen1ThemePack.THEME_CODE);
            gachaCatalogSeeder.seedIfNeeded();
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

    private void ensureSuperAdmin(String loginId, String password) {
        userAccountRepository.findByLoginId(loginId).ifPresentOrElse(
                userAccount -> {
                    if (!password.equals(userAccount.getPassword())) {
                        userAccount.updatePassword(password);
                        userAccountRepository.save(userAccount);
                    }
                },
                () -> userAccountRepository.save(UserAccount.builder()
                        .loginId(loginId)
                        .password(password)
                        .build())
        );
    }

    private void createSettingIfMissing(String key, String value) {
        if (appSettingRepository.findBySettingKey(key).isPresent()) {
            return;
        }
        appSettingRepository.save(AppSetting.builder()
                .settingKey(key)
                .settingValue(value)
                .build());
    }
}
