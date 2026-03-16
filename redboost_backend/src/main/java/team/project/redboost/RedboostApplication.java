package team.project.redboost;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RedboostApplication {

    public static void main(String[] args) {
        SpringApplication.run(RedboostApplication.class, args);
    }

}
