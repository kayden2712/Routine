package com.example.be.security;

import java.util.regex.Pattern;

import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

@SuppressWarnings("null")
public final class SearchInputSanitizer {

    private static final Pattern SUSPICIOUS_PATTERN = Pattern.compile(
            "(?i)(<\\s*/?\\s*script\\b|javascript:|on\\w+\\s*=|<|>|\"|'|`|\\b(alert|prompt|confirm)\\s*\\()");

    private SearchInputSanitizer() {
    }

    public static String sanitize(String rawInput) {
        if (!StringUtils.hasText(rawInput)) {
            return "";
        }

        String normalized = rawInput.trim().replaceAll("\\s+", " ");

        if (SUSPICIOUS_PATTERN.matcher(normalized).find()) {
            String encoded = HtmlUtils.htmlEscape(normalized);
            return encoded != null ? encoded : "";
        }

        return normalized;
    }
}
