package team.project.redboost.config;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;


@Configuration
public class FileUploadConfig {

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        
        // Définition de la taille maximale d'un fichier (50 MB)
        factory.setMaxFileSize(DataSize.ofMegabytes(50));
        
        // Définition de la taille maximale de la requête totale (50 MB)
        factory.setMaxRequestSize(DataSize.ofMegabytes(50));
        
        return factory.createMultipartConfig();
    }
}
