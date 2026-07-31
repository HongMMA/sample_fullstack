package com.example.board.service;

import com.example.board.exception.BadRequestException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class GachaMediaStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp"
    );

    private final Path rootDir;

    public GachaMediaStorageService(@Value("${app.gacha.media-dir:uploads/gacha}") String mediaDir) {
        this.rootDir = Path.of(mediaDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootDir);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to create gacha media directory: " + this.rootDir, ex);
        }
    }

    public StoredImage store(String themeCode, String artKey, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("이미지 파일이 필요합니다.");
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("PNG, JPEG, WEBP 이미지만 업로드할 수 있습니다.");
        }

        String extension = extensionFor(contentType);
        String storedFileName = artKey + extension;
        Path themeDir = rootDir.resolve(sanitizePathSegment(themeCode)).normalize();
        if (!themeDir.startsWith(rootDir)) {
            throw new BadRequestException("잘못된 테마 경로입니다.");
        }

        try {
            Files.createDirectories(themeDir);
            Path target = themeDir.resolve(storedFileName).normalize();
            if (!target.startsWith(themeDir)) {
                throw new BadRequestException("잘못된 파일 경로입니다.");
            }
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredImage(storedFileName, contentType);
        } catch (IOException ex) {
            throw new IllegalStateException("이미지 저장에 실패했습니다.", ex);
        }
    }

    public Resource loadAsResource(String themeCode, String fileName) {
        try {
            Path file = rootDir
                    .resolve(sanitizePathSegment(themeCode))
                    .resolve(sanitizePathSegment(fileName))
                    .normalize();
            if (!file.startsWith(rootDir) || !Files.isRegularFile(file)) {
                return null;
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return null;
            }
            return resource;
        } catch (IOException ex) {
            return null;
        }
    }

    private static String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "";
        }
        return contentType.toLowerCase(Locale.ROOT).split(";", 2)[0].trim();
    }

    private static String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            default -> ".png";
        };
    }

    private static String sanitizePathSegment(String value) {
        if (value == null || value.isBlank() || value.contains("..") || value.contains("/") || value.contains("\\")) {
            throw new BadRequestException("잘못된 경로입니다.");
        }
        return value;
    }

    public record StoredImage(String storedFileName, String contentType) {
    }
}
