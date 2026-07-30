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

    private final AppSettingRepository appSettingRepository;

    public boolean isPostWriteEnabled() {
        return appSettingRepository.findBySettingKey(POST_WRITE_ENABLED_KEY)
                .map(setting -> Boolean.parseBoolean(setting.getSettingValue()))
                .orElse(true);
    }

    public PostWriteSettingResponse getPostWriteSetting() {
        return new PostWriteSettingResponse(isPostWriteEnabled());
    }

    @Transactional
    public PostWriteSettingResponse updatePostWriteSetting(boolean enabled) {
        AppSetting setting = appSettingRepository.findBySettingKey(POST_WRITE_ENABLED_KEY)
                .orElseGet(() -> AppSetting.builder()
                        .settingKey(POST_WRITE_ENABLED_KEY)
                        .settingValue(Boolean.toString(enabled))
                        .build());
        setting.updateValue(Boolean.toString(enabled));
        appSettingRepository.save(setting);
        return new PostWriteSettingResponse(enabled);
    }
}
