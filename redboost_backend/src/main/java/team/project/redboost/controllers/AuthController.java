package team.project.redboost.controllers;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import team.project.redboost.config.JwtUtil;
import team.project.redboost.entities.*;
import team.project.redboost.services.CustomUserDetailsService;
import team.project.redboost.services.EmailService;
import team.project.redboost.services.FirebaseService;
import team.project.redboost.services.UserService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/Auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FirebaseService firebaseService;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UserService userService;

    @Autowired
    public AuthController(FirebaseService firebaseService, UserService userService, JwtUtil jwtUtil) {
        this.firebaseService = firebaseService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/firebase")
    public ResponseEntity<?> firebaseLogin(@RequestBody Map<String, String> request, HttpServletResponse response) {
        String idToken = request.get("idToken");

        try {
            FirebaseToken decodedToken = firebaseService.verifyIdToken(idToken);
            String email = decodedToken.getEmail();
            
            // Check if user exists
            User user = userService.findByEmail(email);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "User not found. Please register first.",
                        "errorCode", "AUTH008"
                ));
            }

            // Generate JWT tokens
            final String accessToken = jwtUtil.generateToken(user.getEmail(), String.valueOf(user.getId()), user.getAuthorities());
            final String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), String.valueOf(user.getId()), user.getAuthorities());

            // Set tokens as HTTP-only cookies
            Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(true);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            response.addCookie(accessTokenCookie);

            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(true);
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 30 days
            response.addCookie(refreshTokenCookie);

            return ResponseEntity.ok(Map.of(
                    "accessToken", accessToken,
                    "refreshToken", refreshToken,
                    "roles", user.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toList()),
                    "user", user
            ));
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid ID token", "error", e.getMessage()));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest, HttpServletResponse response) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");
        log.info("Authenticating user with email: {}", email);

        try {
            // Check if user exists before authentication
            User user = userService.findByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "User not found with email: " + email,
                        "errorCode", "AUTH008"
                ));
            }

            // Check if user is active (email confirmed)
            if (!user.isActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "message", "Please confirm your email before logging in!",
                        "errorCode", "AUTH017"
                ));
            }

            // Authenticate user
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));

            // Load user details
            final UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            // Generate JWT token
            final String accessToken = jwtUtil.generateToken(userDetails.getUsername(), String.valueOf(user.getId()), userDetails.getAuthorities());
            final String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), String.valueOf(user.getId()), userDetails.getAuthorities());

            // Set tokens as HTTP-only cookies
            Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(true);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            response.addCookie(accessTokenCookie);

            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(true);
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 30 days
            response.addCookie(refreshTokenCookie);

            System.out.println("Current server time: " + LocalDateTime.now());
            return ResponseEntity.ok(Map.of(
                    "accessToken", accessToken,
                    "refreshToken", refreshToken,
                    "message", "Login successful"
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Password incorrect",
                    "errorCode", "AUTH010"
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", "AUTH009"
            ));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @RequestBody(required = false) Map<String, String> refreshRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = null;

        // Check for refresh token in the request body
        if (refreshRequest != null && refreshRequest.containsKey("refreshToken")) {
            refreshToken = refreshRequest.get("refreshToken");
        }

        // Check for refresh token in cookies if not in body
        if (refreshToken == null) {
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("refreshToken".equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }
        }

        // Return error if no refresh token is found
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Refresh token not found",
                    "errorCode", "AUTH003"
            ));
        }

        try {
            // Validate refresh token
            if (!jwtUtil.validateToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "Invalid or expired refresh token",
                        "errorCode", "AUTH005"
                ));
            }

            // Extract email and userId
            String email = jwtUtil.extractEmail(refreshToken);
            String userId = jwtUtil.extractUserId(refreshToken);

            // Load user details
            UserDetails userDetails;
            try {
                userDetails = userDetailsService.loadUserByUsername(email);
            } catch (UsernameNotFoundException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "User not found",
                        "errorCode", "AUTH008"
                ));
            }

            // Generate new access token
            String newAccessToken = jwtUtil.generateToken(email, userId, userDetails.getAuthorities());

            // Rotate refresh token
            String newRefreshToken = jwtUtil.generateRefreshToken(email, userId, userDetails.getAuthorities());

            // Set new tokens as cookies
            Cookie accessTokenCookie = new Cookie("accessToken", newAccessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(true);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(7 * 24 * 60 * 60);
            response.addCookie(accessTokenCookie);

            Cookie refreshTokenCookie = new Cookie("refreshToken", newRefreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(true);
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60);
            response.addCookie(refreshTokenCookie);

            return ResponseEntity.ok(Map.of(
                    "accessToken", newAccessToken,
                    "refreshToken", newRefreshToken,
                    "message", "Token refreshed successfully"
            ));

        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to refresh token",
                    "errorCode", "AUTH007"
            ));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> registrationRequest) {
        try {
            String email = registrationRequest.get("email");
            String password = registrationRequest.get("password");
            String firstName = registrationRequest.get("firstName");
            String lastName = registrationRequest.get("lastName");
            String phoneNumber = registrationRequest.get("phoneNumber");
            Role role = Role.valueOf(registrationRequest.get("role"));

            // Validate required fields
            if (email == null || password == null || firstName == null || lastName == null || phoneNumber == null || role == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "All fields are required!",
                        "errorCode", "AUTH010"
                ));
            }

            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Invalid email format!",
                        "errorCode", "AUTH012"
                ));
            }

            // Check if user already exists
            if (userService.findByEmail(email) != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "message", "User already exists!",
                        "errorCode", "AUTH011"
                ));
            }

            // Create new user (all roles use the same User entity)
            User user = new User();
            user.setEmail(email);
            user.setPassword(password);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPhoneNumber(phoneNumber);
            user.setRole(role);

            String confirmationCode = user.generateConfirmationCode();
            user.setConfirm_code(confirmationCode);
            user.setActive(false);
            
            System.out.println("Generated confirmation code: " + confirmationCode);

            User savedUser = userService.addUser(user);
            System.out.println("Saved user confirmation code: " + savedUser.getConfirm_code());

            // Send confirmation email
            String confirmationLink = "https://redboost.tn/confirm-email?email=" + email + "&code=" + confirmationCode;
            String subject = "Confirm your email";
            String body = "Hello " + firstName + " " + lastName + ",\n\n" +
                    "Thank you for registering!\n\n" +
                    "Please confirm your email by clicking the following link:\n" +
                    confirmationLink + "\n\n" +
                    "Alternatively, use this confirmation code: " + confirmationCode + "\n\n" +
                    "Best regards,\nRedboost Team";
            emailService.sendEmail(email, subject, body);

            return ResponseEntity.ok(Map.of("message", "Registration successful! A confirmation email has been sent."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Registration failed",
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/confirm-email")
    public ResponseEntity<?> confirmEmail(@RequestBody Map<String, String> confirmationRequest) {
        try {
            String email = confirmationRequest.get("email");
            String code = confirmationRequest.get("code");

            User user = userService.findByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "User not found!",
                        "errorCode", "AUTH013"
                ));
            }

            if (user.getConfirm_code().equals(code)) {
                user.setActive(true);
                userService.updateUser(user);
                return ResponseEntity.ok(Map.of("message", "Email confirmed successfully!"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Invalid confirmation code!",
                        "errorCode", "AUTH014"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Email confirmation failed",
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/resend-confirmation")
    public ResponseEntity<?> resendConfirmationEmail(@RequestBody Map<String, String> resendRequest) {
        try {
            String email = resendRequest.get("email");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Email is required!",
                        "errorCode", "AUTH015"
                ));
            }

            User user = userService.findByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "User not found!",
                        "errorCode", "AUTH013"
                ));
            }

            if (user.isActive()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Email is already confirmed!",
                        "errorCode", "AUTH016"
                ));
            }

            String confirmationCode = user.getConfirm_code();

            // Send confirmation email
            String confirmationLink = "https://redboost.tn/confirm-email?email=" + email + "&code=" + confirmationCode;
            String subject = "Confirm your email";
            String body = "Hello " + user.getFirstName() + " " + user.getLastName() + ",\n\n" +
                    "Thank you for registering!\n\n" +
                    "Please confirm your email by clicking the following link:\n" +
                    confirmationLink + "\n\n" +
                    "Alternatively, use this confirmation code: " + confirmationCode + "\n\n" +
                    "Best regards,\nRedboost Team";
            emailService.sendEmail(email, subject, body);

            return ResponseEntity.ok(Map.of("message", "Confirmation email resent successfully!"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to resend confirmation email",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/verifyToken")
    public ResponseEntity<?> verifyToken(@RequestHeader("Authorization") String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            if (jwtUtil.validateToken(token)) {
                return ResponseEntity.ok(Map.of(
                        "message", "Token is valid",
                        "email", jwtUtil.extractEmail(token),
                        "userId", jwtUtil.extractUserId(token)
                ));
            } else {
                return ResponseEntity.status(401).body(Map.of(
                        "message", "Invalid or expired token"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Failed to verify token",
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear accessToken cookie
        Cookie accessTokenCookie = new Cookie("accessToken", null);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(true);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setDomain("localhost");
        accessTokenCookie.setMaxAge(0);
        response.addCookie(accessTokenCookie);

        // Clear refreshToken cookie
        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setDomain("localhost");
        refreshTokenCookie.setMaxAge(0);
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok().body(Map.of("message", "Logout successful"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Email is required",
                        "errorCode", "AUTH015"
                ));
            }

            User user = userService.findByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "User not found",
                        "errorCode", "AUTH013"
                ));
            }

            String resetToken = userService.generatePasswordResetToken(user);
            String resetLink = "https://test.redboost.tn/reset-password?token=" + resetToken;
            String subject = "Password Reset Request";
            String body = "Hello " + user.getFirstName() + ",\n\n" +
                    "You requested to reset your password. Please click the link below to reset your password:\n\n" +
                    resetLink + "\n\n" +
                    "If you didn't request this, please ignore this email.\n\n" +
                    "Best regards,\nRedboost Team";

            emailService.sendEmail(email, subject, body);

            return ResponseEntity.ok(Map.of("message", "Password reset email sent successfully"));

        } catch (IOException | MessagingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to send reset email. Please try again later.",
                    "errorCode", "AUTH018",
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to process password reset request",
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            if (token == null || token.isEmpty() || newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Token and new password are required",
                        "errorCode", "AUTH016"
                ));
            }

            // Validate token and get user
            User user = userService.findByResetToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "message", "Invalid or expired token",
                        "errorCode", "AUTH017"
                ));
            }

            // Update password and activate user
            userService.updatePassword(user, newPassword);
            user.setActive(true);
            userService.updateUser(user);

            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));

        } catch (UserService.InvalidTokenException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage(),
                    "errorCode", "AUTH017"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to reset password",
                    "error", e.getMessage()
            ));
        }
    }

    // Helper method for capitalizing strings
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
