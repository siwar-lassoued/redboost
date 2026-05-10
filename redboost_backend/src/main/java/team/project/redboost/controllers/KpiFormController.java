package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.entities.KpiForm;
import team.project.redboost.entities.KpiFormAnswer;
import team.project.redboost.entities.KpiFormResponse;
import team.project.redboost.entities.ThematiqueCoaching;
import team.project.redboost.entities.User;
import team.project.redboost.services.KpiFormService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kpi-forms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class KpiFormController {

    private final KpiFormService kpiFormService;

    @GetMapping
    public ResponseEntity<List<KpiForm>> getAllForms() {
        return ResponseEntity.ok(kpiFormService.getAllForms());
    }

    @GetMapping("/programme/{programmeId}")
    public ResponseEntity<List<KpiForm>> getFormsByProgramme(@PathVariable Long programmeId) {
        return ResponseEntity.ok(kpiFormService.getFormsByProgramme(programmeId));
    }

    @GetMapping("/type/kpi")
    public ResponseEntity<List<KpiForm>> getKpiForms() {
        return ResponseEntity.ok(kpiFormService.getKpiForms());
    }

    @GetMapping("/type/evaluation")
    public ResponseEntity<List<KpiForm>> getEvaluationForms() {
        return ResponseEntity.ok(kpiFormService.getEvaluationForms());
    }

    @GetMapping("/evaluation/thematique/{thematiqueId}")
    public ResponseEntity<List<KpiForm>> getEvaluationFormsByThematique(@PathVariable Long thematiqueId) {
        return ResponseEntity.ok(kpiFormService.getEvaluationFormsByThematique(thematiqueId));
    }

    @GetMapping("/evaluation/coach/{coachId}")
    public ResponseEntity<List<KpiForm>> getEvaluationFormsByCoach(@PathVariable Long coachId) {
        return ResponseEntity.ok(kpiFormService.getEvaluationFormsByCoach(coachId));
    }

    @GetMapping("/programme/{programmeId}/thematiques")
    public ResponseEntity<List<ThematiqueCoaching>> getThematiquesByProgramme(@PathVariable Long programmeId) {
        return ResponseEntity.ok(kpiFormService.getThematiquesByProgramme(programmeId));
    }

    @GetMapping("/programme/{programmeId}/coaches")
    public ResponseEntity<List<User>> getCoachesByProgramme(@PathVariable Long programmeId) {
        return ResponseEntity.ok(kpiFormService.getCoachesByProgramme(programmeId));
    }

    @GetMapping("/programme/{programmeId}/thematique/{thematiqueId}/entrepreneurs")
    public ResponseEntity<List<User>> getEntrepreneursForEvaluation(
            @PathVariable Long programmeId,
            @PathVariable Long thematiqueId) {
        return ResponseEntity.ok(kpiFormService.getEntrepreneursForEvaluation(programmeId, thematiqueId));
    }

    @GetMapping("/programme/{programmeId}/entrepreneurs")
    public ResponseEntity<List<User>> getEntrepreneursForProgramme(@PathVariable Long programmeId) {
        return ResponseEntity.ok(kpiFormService.getEntrepreneursForProgramme(programmeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KpiForm> getFormById(@PathVariable Long id) {
        return ResponseEntity.ok(kpiFormService.getFormById(id));
    }

    @PostMapping
    public ResponseEntity<KpiForm> createForm(@RequestBody KpiForm form) {
        return ResponseEntity.ok(kpiFormService.createForm(form));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KpiForm> updateForm(@PathVariable Long id, @RequestBody KpiForm form) {
        return ResponseEntity.ok(kpiFormService.updateForm(id, form));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteForm(@PathVariable Long id) {
        kpiFormService.deleteForm(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<Void> sendForm(@PathVariable Long id, @RequestBody Map<String, List<Long>> payload) {
        List<Long> entrepreneurIds = payload.get("entrepreneurIds");
        if (entrepreneurIds != null && !entrepreneurIds.isEmpty()) {
            kpiFormService.sendFormToEntrepreneurs(id, entrepreneurIds);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/responses")
    public ResponseEntity<List<KpiFormResponse>> getResponsesForForm(@PathVariable Long id) {
        return ResponseEntity.ok(kpiFormService.getResponsesForForm(id));
    }

    @GetMapping("/entrepreneur/{entrepreneurId}")
    public ResponseEntity<List<KpiFormResponse>> getPendingFormsForEntrepreneur(@PathVariable Long entrepreneurId) {
        return ResponseEntity.ok(kpiFormService.getPendingFormsForEntrepreneur(entrepreneurId));
    }

    @PostMapping("/responses/{responseId}/submit")
    public ResponseEntity<KpiFormResponse> submitResponse(@PathVariable Long responseId, @RequestBody List<KpiFormAnswer> answers) {
        return ResponseEntity.ok(kpiFormService.submitResponse(responseId, answers));
    }
}
