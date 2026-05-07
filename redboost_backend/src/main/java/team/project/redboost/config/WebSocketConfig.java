package team.project.redboost.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;

@Configuration
@EnableWebSocketMessageBroker
@lombok.RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final team.project.redboost.config.JwtUtil jwtUtils;
    private final team.project.redboost.services.CustomUserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker for topic and user-specific queues
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefix for messages from client to server
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix for user-specific destinations
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws", "/api/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(
            org.springframework.messaging.simp.config.ChannelRegistration registration) {
        registration.interceptors(new org.springframework.messaging.support.ChannelInterceptor() {
            @Override
            public org.springframework.messaging.Message<?> preSend(org.springframework.messaging.Message<?> message,
                    org.springframework.messaging.MessageChannel channel) {
                org.springframework.messaging.simp.stomp.StompHeaderAccessor accessor = org.springframework.messaging.support.MessageHeaderAccessor
                        .getAccessor(message, org.springframework.messaging.simp.stomp.StompHeaderAccessor.class);

                if (org.springframework.messaging.simp.stomp.StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        String token = authToken.substring(7);
                        if (jwtUtils.validateToken(token)) {
                            // Use userId as the STOMP principal name so that
                            // messagingTemplate.convertAndSendToUser(userId, ...) routes correctly.
                            String userId = jwtUtils.extractUserId(token);
                            if (userId != null && !userId.isBlank()) {
                                // Create a proper Authentication object so Spring Security recognizes it
                                org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication =
                                        new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                                userId, null, java.util.Collections.emptyList()
                                        );
                                accessor.setUser(authentication);
                            } else {
                                // Fallback: use email as principal
                                String email = jwtUtils.extractEmail(token);
                                if (email != null && !email.isBlank()) {
                                    org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication =
                                            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                                    email, null, java.util.Collections.emptyList()
                                            );
                                    accessor.setUser(authentication);
                                } else {
                                    throw new org.springframework.messaging.MessageDeliveryException(
                                        message, "STOMP CONNECT rejected: token contains no valid user identity");
                                }
                            }
                        } else {
                            // Token present but invalid/expired — reject cleanly
                            throw new org.springframework.messaging.MessageDeliveryException(
                                message, "STOMP CONNECT rejected: invalid or expired JWT token");
                        }
                    } else {
                        // No Authorization header — reject the CONNECT
                        throw new org.springframework.messaging.MessageDeliveryException(
                            message, "STOMP CONNECT rejected: missing Authorization header");
                    }
                }
                return message;

            }
        });
    }
}