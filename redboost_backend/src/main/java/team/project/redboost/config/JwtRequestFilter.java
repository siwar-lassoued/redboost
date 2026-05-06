package team.project.redboost.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        // Skip filtering for public endpoints
        return path.startsWith("/api/Auth/") || path.startsWith("/ws/") || path.startsWith("/api/ws");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");
        String email = null;
        String jwtToken = null;

        // ── Extract token from Authorization header ──────────────────────────
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwtToken = authorizationHeader.substring(7);
            try {
                email = jwtUtil.extractEmail(jwtToken);
                String userId = jwtUtil.extractUserId(jwtToken);
                logger.info("JWT Token extracted. Email: " + email + ", UserId: " + userId);
            } catch (io.jsonwebtoken.ExpiredJwtException ex) {
                logger.warn("JWT token expired for request [" + request.getServletPath() + "]. Proceeding unauthenticated.");
                jwtToken = null; // treat as missing
            } catch (Exception ex) {
                logger.warn("Invalid JWT token for request [" + request.getServletPath() + "]: " + ex.getMessage());
                jwtToken = null; // treat as missing
            }
        }

        // ── Fallback: try cookie ─────────────────────────────────────────────
        if (jwtToken == null) {
            jwtToken = getJwtFromCookies(request);
            if (jwtToken != null) {
                try {
                    email = jwtUtil.extractEmail(jwtToken);
                } catch (Exception ex) {
                    logger.warn("Invalid JWT in cookie: " + ex.getMessage());
                    jwtToken = null;
                }
            }
        }

        // ── Validate and set authentication ──────────────────────────────────
        if (email != null && jwtToken != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(email);
                logger.info("UserDetails loaded: " + userDetails.getUsername());

                if (jwtUtil.validateToken(jwtToken, userDetails.getUsername())) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (org.springframework.security.core.userdetails.UsernameNotFoundException ex) {
                logger.warn("JWT token parsed, but User not found: " + email + ". Ignoring token.");
            } catch (Exception ex) {
                logger.warn("Error authenticating user [" + email + "]: " + ex.getMessage());
            }
        }

        chain.doFilter(request, response);
    }


    private String getJwtFromCookies(HttpServletRequest request) {
        if (request.getCookies() != null) {
            Optional<Cookie> jwtCookie = Arrays.stream(request.getCookies())
                    .filter(cookie -> "jwt".equals(cookie.getName()))
                    .findFirst();
            return jwtCookie.map(Cookie::getValue).orElse(null);
        }
        return null;
    }


}