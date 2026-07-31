package com.example.board.controller;

import com.example.board.service.GachaMediaStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gacha/media")
@RequiredArgsConstructor
public class GachaMediaController {

    private final GachaMediaStorageService gachaMediaStorageService;

    @GetMapping("/{themeCode}/{fileName}")
    public ResponseEntity<Resource> getMedia(
            @PathVariable String themeCode,
            @PathVariable String fileName
    ) {
        Resource resource = gachaMediaStorageService.loadAsResource(themeCode, fileName);
        if (resource == null) {
            return ResponseEntity.notFound().build();
        }
        MediaType mediaType = mediaTypeFor(fileName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .contentType(mediaType)
                .body(resource);
    }

    private static MediaType mediaTypeFor(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        }
        if (lower.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_PNG;
    }
}
