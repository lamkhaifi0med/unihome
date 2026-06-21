package com.unihome.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Authenticates internal service-to-service calls on {@code /api/internal/**}
 * using a shared secret carried in the {@code X-Internal-API-Key} header. The
 * comparison uses {@link MessageDigest#isEqual(byte[], byte[])} which runs in
 * constant time to prevent timing attacks. Any mismatch returns 401 without
 * leaking whether the header was missing or wrong.
 *
 * <p>The expected key is read from {@code unihome.internal.api-key}. To prevent
 * accidentally running with auth disabled in production, the application will
 * fail to start if this property is blank (see {@code SecurityConfig}).</p>
 */
@Component
@Slf4j
public class InternalApiKeyFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Internal-API-Key";
    public static final String PATH_PREFIX = "/api/internal/";

    private final byte[] expectedKey;

    public InternalApiKeyFilter(@Value("${unihome.internal.api-key:}") String configuredKey) {
        this.expectedKey = configuredKey != null
                ? configuredKey.getBytes(StandardCharsets.UTF_8)
                : new byte[0];
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(PATH_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (expectedKey.length == 0) {
            log.error("Internal API key not configured; rejecting call to {}", request.getRequestURI());
            response.sendError(HttpStatus.UNAUTHORIZED.value());
            return;
        }

        String provided = request.getHeader(HEADER_NAME);
        byte[] providedBytes = provided != null
                ? provided.getBytes(StandardCharsets.UTF_8)
                : new byte[0];

        if (!MessageDigest.isEqual(providedBytes, expectedKey)) {
            log.warn("Internal API call rejected for {} (bad or missing key)", request.getRequestURI());
            response.sendError(HttpStatus.UNAUTHORIZED.value());
            return;
        }

        chain.doFilter(request, response);
    }
}
