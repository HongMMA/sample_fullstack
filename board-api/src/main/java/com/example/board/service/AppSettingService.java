package com.example.board.service;

import com.example.board.domain.AppSetting;
import com.example.board.dto.PostWriteSettingResponse;
import com.example.board.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppSettingService {

    public static final String POST_WRITE_ENABLED_KEY = "POST_WRITE_ENABLED";
    public static final String GACHA_ENABLED_KEY = "GACHA_ENABLED";
    public static final String GACHA_CHARACTER_UPLOAD_ENABLED_KEY = "GACHA_CHARACTER_UPLOAD_ENABLED";

    private final AppSettingRepository appSettingRepository;

    public boolean isPostWriteEnabled() {
        return appSettingRepository.findBySettingKey(POST_WRITE_ENABLED_KEY)
                .map(setting -> Boolean.parseBoolean(setting.getSettingValue()))
                .orElse(true);
    }

    public boolean isGachaEnabled() {
        return appSettingRepository.findBySettingKey(GACHA_ENABLED_KEY)
                .map(setting -> Boolean.parseBoolean(setting.getSettingValue()))
                .orElse(false);
    }

    public boolean isGachaCharacterUploadEnabled() {
        return appSettingRepository.findBySettingKey(GACHA_CHARACTER_UPLOAD_ENABLED_KEY)
                .map(setting -> Boolean.parseBoolean(setting.getSettingValue()))
                .orElse(false);
    }

    public PostWriteSettingResponse getPostWriteSetting() {
        return new PostWriteSettingResponse(isPostWriteEnabled());
    }

    public PostWriteSettingResponse getGachaSetting() {
        return new PostWriteSettingResponse(isGachaEnabled());
    }

    public PostWriteSettingResponse getGachaCharacterUploadSetting() {
        return new PostWriteSettingResponse(isGachaCharacterUploadEnabled());
    }

    @Transactional
    public PostWriteSettingResponse updatePostWriteSetting(boolean enabled) {
        return upsertBooleanSetting(POST_WRITE_ENABLED_KEY, enabled);
    }

    @Transactional
    public PostWriteSettingResponse updateGachaSetting(boolean enabled) {
        return upsertBooleanSetting(GACHA_ENABLED_KEY, enabled);
    }

    @Transactional
    public PostWriteSettingResponse updateGachaCharacterUploadSetting(boolean enabled) {
        return upsertBooleanSetting(GACHA_CHARACTER_UPLOAD_ENABLED_KEY, enabled);
    }

    private PostWriteSettingResponse upsertBooleanSetting(String key, boolean enabled) {
        AppSetting setting = appSettingRepository.findBySettingKey(key)
                .orElseGet(() -> AppSetting.builder()
                        .settingKey(key)
                        .settingValue(Boolean.toString(enabled))
                        .build());
        setting.updateValue(Boolean.toString(enabled));
        appSettingRepository.save(setting);
        return new PostWriteSettingResponse(enabled);
    }
}
