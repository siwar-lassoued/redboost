package team.project.redboost.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

/**
 * WebSocket Security Configuration — Spring Security 6 (Spring Boot 3.x).
 *
 * NOTE: @EnableWebSocketMessageBroker is declared only once, in WebSocketConfig.java.
 *       AbstractSecurityWebSocketMessageBrokerConfigurer was removed in Spring Security 6;
 *       we use @EnableWebSocketSecurity + AuthorizationManager<Message<?>> instead.
 */
@Configuration
@EnableWebSocketSecurity
public class WebSocketSecurityConfig {

    @Bean
    AuthorizationManager<Message<?>> messageAuthorizationManager(
            MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        messages
            // Authenticated users only can send to /app/** (server-side handlers)
            .simpDestMatchers("/app/**").authenticated()
            // Authenticated users only can subscribe to user queues and topics
            .simpSubscribeDestMatchers("/user/**", "/topic/**", "/queue/**").authenticated()
            // Everything else is open (e.g. CONNECT, DISCONNECT frames)
            .anyMessage().permitAll();
        return messages.build();
    }

    /**
     * Disable CSRF for WebSockets in Spring Security 6.
     * Since we use JWT (Stateless), CSRF is not needed.
     * Providing a no-op ChannelInterceptor named 'csrfChannelInterceptor' disables the default CSRF check.
     */
    @Bean(name = "csrfChannelInterceptor")
    org.springframework.messaging.support.ChannelInterceptor csrfChannelInterceptor() {
        return new org.springframework.messaging.support.ChannelInterceptor() {
        };
    }

}