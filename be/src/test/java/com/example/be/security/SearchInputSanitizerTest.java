package com.example.be.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class SearchInputSanitizerTest {

    @Test
    void sanitizeEncodesSuspiciousScriptInput() {
        String result = SearchInputSanitizer.sanitize("<script>alert(1)</script>");

        assertEquals("&lt;script&gt;alert(1)&lt;/script&gt;", result);
    }

    @Test
    void sanitizeKeepsNormalKeywordAndNormalizesSpaces() {
        String result = SearchInputSanitizer.sanitize("  ao   so   mi  ");

        assertEquals("ao so mi", result);
    }
}
