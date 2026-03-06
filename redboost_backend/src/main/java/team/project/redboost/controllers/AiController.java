package team.project.redboost.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.dto.ai.CompareResponse;
import team.project.redboost.dto.ai.ImproveRequest;
import team.project.redboost.dto.ai.ImproveResponse;
import team.project.redboost.services.AiService;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/improve")
    public ResponseEntity<ImproveResponse> improve(@RequestBody ImproveRequest improveRequest) {
        ImproveResponse response = aiService.improve(improveRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/compare")
    public ResponseEntity<CompareResponse> compare(
            @RequestParam("recent_program") MultipartFile recentProgram,
            @RequestParam("reference_programs") List<MultipartFile> referencePrograms,
            @RequestParam("model") String model) {
        CompareResponse response = aiService.compare(recentProgram, referencePrograms, model);
        return ResponseEntity.ok(response);
    }
}
