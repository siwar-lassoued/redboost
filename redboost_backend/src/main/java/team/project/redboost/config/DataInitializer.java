package team.project.redboost.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import team.project.redboost.entities.TypeFormation;
import team.project.redboost.entities.User;
import team.project.redboost.entities.Role;
import team.project.redboost.repositories.TypeFormationRepository;
import team.project.redboost.repositories.UserRepository;
import team.project.redboost.services.UserService;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializer {

    @Autowired
    private TypeFormationRepository typeFormationRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // Seed TypeFormations
            List<String> defaultTypes = Arrays.asList(
                    "PITCH_DECK",
                    "NETWORKING",
                    "FORMATION",
                    "ATELIER",
                    "CELEBRATION",
                    "PRESENTATION"
            );

            for (String typeName : defaultTypes) {
                if (typeFormationRepository.findByName(typeName).isEmpty()) {
                    TypeFormation typeFormation = new TypeFormation();
                    typeFormation.setName(typeName);
                    typeFormationRepository.save(typeFormation);
                    System.out.println(" TypeFormation initialized: " + typeName);
                }
            }

            // Seed Users for each Role
            for (Role role : Role.values()) {
                String email = role.name().toLowerCase() + "@redboost.com";
                if (userRepository.findByEmail(email) == null) {
                    User user = new User();
                    user.setEmail(email);
                    user.setFirstName("Test");
                    user.setLastName(role.name());
                    user.setPassword("password123");
                    user.setPhoneNumber("0123456789");
                    user.setRole(role);
                    user.setActive(true);
                    
                    try {
                        userService.addUser(user);
                        System.out.println(" User initialized for role: " + role + " (" + email + ")");
                    } catch (Exception e) {
                        System.err.println(" Failed to initialize user for role: " + role + ". Error: " + e.getMessage());
                    }
                }
            }
        };
    }
}
