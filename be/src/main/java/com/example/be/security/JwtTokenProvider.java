package com.example.be.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

    private static final String TOKEN_TYPE_CLAIM = "tokenType";
    private static final String ROLE_TYPE_CLAIM = "roleType";
    private static final String SELECTED_ROLE_CLAIM = "selectedRole";
    private static final String ACCESS_TOKEN_TYPE = "ACCESS";
    private static final String REFRESH_TOKEN_TYPE = "REFRESH";

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.admin.expiration}")
    private long adminTokenExpiration;

    @Value("${jwt.customer.expiration}")
    private long customerTokenExpiration;

    @Value("${jwt.refresh.expiration}")
    private long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAdminToken(Authentication authentication) {
        return generateAdminToken(authentication, null);
    }

    public String generateAdminToken(Authentication authentication, String selectedRole) {
        return generateAccessToken(authentication.getName(), adminTokenExpiration, "ADMIN", selectedRole);
    }

    public String generateCustomerToken(Authentication authentication) {
        return generateAccessToken(authentication.getName(), customerTokenExpiration, "CUSTOMER", null);
    }

    public String generateRefreshToken(Authentication authentication) {
        return generateRefreshToken(authentication, null);
    }

    public String generateRefreshToken(Authentication authentication, String selectedRole) {
        return generateRefreshTokenByEmail(authentication.getName(), selectedRole);
    }

    public String generateRefreshTokenByEmail(String email) {
        return generateRefreshTokenByEmail(email, null);
    }

    public String generateRefreshTokenByEmail(String email, String selectedRole) {
        return generateToken(email, refreshTokenExpiration, REFRESH_TOKEN_TYPE, "AUTH", selectedRole);
    }

    private String generateAccessToken(String email, long expiration, String roleType, String selectedRole) {
        return generateToken(email, expiration, ACCESS_TOKEN_TYPE, roleType, selectedRole);
    }

    private String generateToken(String email, long expiration, String tokenType, String roleType, String selectedRole) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        var builder = Jwts.builder()
                .subject(email)
                .claim(TOKEN_TYPE_CLAIM, tokenType)
                .claim(ROLE_TYPE_CLAIM, roleType)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey());

        if (selectedRole != null && !selectedRole.isBlank()) {
            builder.claim(SELECTED_ROLE_CLAIM, selectedRole);
        }

        return builder.compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public String getTypeFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get(TOKEN_TYPE_CLAIM, String.class);
    }

    public String getRoleTypeFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get(ROLE_TYPE_CLAIM, String.class);
    }

    public String getSelectedRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get(SELECTED_ROLE_CLAIM, String.class);
    }

    public boolean validateToken(String token) {
        return validateAndMatchTokenType(token, null);
    }

    public boolean validateAccessToken(String token) {
        return validateAndMatchTokenType(token, ACCESS_TOKEN_TYPE);
    }

    public boolean validateRefreshToken(String token) {
        return validateAndMatchTokenType(token, REFRESH_TOKEN_TYPE);
    }

    private boolean validateAndMatchTokenType(String token, String expectedType) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            if (expectedType == null) {
                return true;
            }
            return expectedType.equals(claims.get(TOKEN_TYPE_CLAIM, String.class));
        } catch (SecurityException | MalformedJwtException | ExpiredJwtException | UnsupportedJwtException
                | IllegalArgumentException ex) {
            // Invalid, expired, unsupported token, or empty claims
        }
        return false;
    }
}
