package team.project.redboost.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;

@Configuration
@EnableWebSocketMessageBroker
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        log.info("✅ WebSocket endpoint registered at /ws with SockJS");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");

        log.info("✅ Message broker configured: /topic, /queue, /app, /user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String token = accessor.getFirstNativeHeader("Authorization");

                    log.info("🔌 WebSocket CONNECT attempt");

                    if (token != null && token.startsWith("Bearer ")) {
                        token = token.substring(7);
                        try {
                            String email = jwtUtil.extractEmail(token);
                            log.info("📧 Extracted email from token: {}", email);

                            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                            if (jwtUtil.validateToken(token, userDetails.getUsername())) {
                                // ✅ CRITICAL FIX: Create a SimplePrincipal with the email
                                // This ensures that convertAndSendToUser(email, ...) works correctly
                                Principal principal = new SimplePrincipal(email);
                                accessor.setUser(principal);

                                log.info("✅ WebSocket authenticated for user: {}", email);
                                return message;
                            } else {
                                log.error("❌ Invalid token for user: {}", email);
                            }
                        } catch (Exception e) {
                            log.error("❌ Error during WebSocket authentication: {}", e.getMessage());
                            throw new SecurityException("Invalid or unauthorized JWT token: " + e.getMessage());
                        }
                    } else {
                        log.error("❌ No Authorization header in WebSocket CONNECT");
                    }
                    throw new SecurityException("Unauthorized: No valid Authorization header");
                }
                return message;
            }
        });
    }

    /**
     * Simple Principal implementation that returns the user's email
     * This is crucial for convertAndSendToUser() to work correctly
     */
    private static class SimplePrincipal implements Principal {
        private final String name;

        public SimplePrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }

        @Override
        public String toString() {
            return "SimplePrincipal{name='" + name + "'}";
        }
    }
}