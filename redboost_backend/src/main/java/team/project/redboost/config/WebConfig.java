package team.project.redboost.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // Ensure the path ends with a slash and uses "file:" protocol
        String resourceLocation = "file:" + uploadDir + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(0);
    }
}