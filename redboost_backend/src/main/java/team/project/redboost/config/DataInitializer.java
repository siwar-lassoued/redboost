package team.project.redboost.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import team.project.redboost.entities.TypeFormation;
import team.project.redboost.repositories.TypeFormationRepository;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(TypeFormationRepository typeFormationRepository) {
        return args -> {
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
                    System.out.println("✅ TypeFormation initialized: " + typeName);
                }
            }
        };
    }
}
