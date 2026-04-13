package com.example.be.security;

import java.io.IOException;
import java.util.Collection;

import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class PayrollRoleGuardFilter extends OncePerRequestFilter {

    @Override
        protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();
        String method = request.getMethod();

        if (!uri.startsWith("/api/payroll") || (!"POST".equals(method) && !"PUT".equals(method))) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            throw new AccessDeniedException("Bạn không có quyền thực hiện hành động này");
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        boolean isAdmin = hasRole(authorities, "ROLE_ADMIN");
        boolean isAccountant = hasRole(authorities, "ROLE_ACCOUNTANT");
        boolean isManager = hasRole(authorities, "ROLE_MANAGER");

        if (uri.matches("^/api/payroll/\\d+/approve$")) {
            if (!(isAdmin || isManager)) {
                throw new AccessDeniedException("Chỉ MANAGER hoặc ADMIN được phê duyệt bảng lương");
            }
        } else {
            if (!(isAdmin || isAccountant || isManager)) {
                throw new AccessDeniedException("Chỉ ACCOUNTANT hoặc MANAGER được chỉnh sửa bảng lương");
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean hasRole(Collection<? extends GrantedAuthority> authorities, String role) {
        return authorities.stream().anyMatch(authority -> role.equals(authority.getAuthority()));
    }
}
