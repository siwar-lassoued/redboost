package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.ai.CompareResponse;
import team.project.redboost.dto.ai.ImproveRequest;
import team.project.redboost.dto.ai.ImproveResponse;

import java.io.IOException;
import java.util.List;

@Service
public class AiService {

    private final RestTemplate restTemplate;

    @Value("${ai.service.base-url}")
    private String aiApiUrl;

    public AiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public ImproveResponse improve(ImproveRequest improveRequest) {
        String url = aiApiUrl + "/api/writing/improve";
        return restTemplate.postForObject(url, improveRequest, ImproveResponse.class);
    }

    public CompareResponse compare(MultipartFile recentProgram, List<MultipartFile> referencePrograms, String model) {
        String url = aiApiUrl + "/api/analysis/compare";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        
        try {
            body.add("recent_program", new ByteArrayResource(recentProgram.getBytes()) {
                @Override
                public String getFilename() {
                    return recentProgram.getOriginalFilename();
                }
            });

            for (MultipartFile referenceProgram : referencePrograms) {
                body.add("reference_programs", new ByteArrayResource(referenceProgram.getBytes()) {
                    @Override
                    public String getFilename() {
                        return referenceProgram.getOriginalFilename();
                    }
                });
            }
        } catch (IOException e) {
            throw new RuntimeException("Error processing files", e);
        }

        body.add("model", model);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        return restTemplate.postForObject(url, requestEntity, CompareResponse.class);
    }
}
