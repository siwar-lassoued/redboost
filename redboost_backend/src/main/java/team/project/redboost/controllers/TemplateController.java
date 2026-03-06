package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.CreateTemplateRequest;
import team.project.redboost.dto.TemplateResponse;
import team.project.redboost.entities.User;
import team.project.redboost.services.TemplateService;
import team.project.redboost.services.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TemplateController {

    private final TemplateService templateService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<TemplateResponse> createTemplate(
            @RequestBody CreateTemplateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        TemplateResponse response = templateService.createTemplate(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<TemplateResponse> getTemplate(@PathVariable Long templateId) {
        TemplateResponse response = templateService.getTemplate(templateId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<TemplateResponse>> getAllTemplates(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        List<TemplateResponse> responses = templateService.getAllTemplates(user.getId());
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{templateId}")
    public ResponseEntity<TemplateResponse> updateTemplate(
            @PathVariable Long templateId,
            @RequestBody CreateTemplateRequest request) {
        TemplateResponse response = templateService.updateTemplate(templateId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long templateId) {
        templateService.deleteTemplate(templateId);
        return ResponseEntity.noContent().build();
    }
}
