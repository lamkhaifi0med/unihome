package com.unihome.api.config;

import com.unihome.api.security.InternalApiKeyFilter;
import com.unihome.api.security.JwtFilter;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final InternalApiKeyFilter internalApiKeyFilter;

    @Value("${unihome.internal.api-key:}")
    private String internalApiKey;

    public SecurityConfig(JwtFilter jwtFilter, InternalApiKeyFilter internalApiKeyFilter) {
        this.jwtFilter = jwtFilter;
        this.internalApiKeyFilter = internalApiKeyFilter;
    }

    /**
     * Fails fast at startup if the internal API key shared with the AI service
     * is missing or shorter than 32 chars. Forces the operator to provision a
     * strong secret in every environment.
     */
    @PostConstruct
    public void validateInternalApiKey() {
        if (internalApiKey == null || internalApiKey.length() < 32) {
            throw new IllegalStateException(
                    "unihome.internal.api-key is not configured or too short (>= 32 chars required). " +
                            "Generate one with: openssl rand -hex 32"
            );
        }
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Sans authentification valide (token absent/expire/invalide) -> 401,
            // pas 403 : le frontend declenche la deconnexion automatique sur 401.
            .exceptionHandling(handling -> handling
                .authenticationEntryPoint((request, response, authException) ->
                    response.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED, "Non authentifié")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/internal/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/chatbot").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/annonces/recherche/interpret").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/annonces/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/avis/annonce/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/universites").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/equipements").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(internalApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOrigins(java.util.Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(java.util.Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
