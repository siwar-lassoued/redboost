package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiFormService {

    private final KpiFormRepository kpiFormRepository;
    private final KpiFormResponseRepository kpiFormResponseRepository;
    private final UserRepository userRepository;
    private final ProgrammeKpiService programmeKpiService;

    public List<KpiForm> getAllForms() {
        return kpiFormRepository.findAll();
    }

    public List<KpiForm> getFormsByProgramme(Long programmeId) {
        return kpiFormRepository.findByProgrammeId(programmeId);
    }

    public List<KpiForm> getFormsByType(KpiForm.FormType formType) {
        return kpiFormRepository.findAll().stream()
            .filter(form -> form.getFormType() == formType)
            .collect(Collectors.toList());
    }

    public List<KpiForm> getKpiForms() {
        return getFormsByType(KpiForm.FormType.KPI);
    }

    public List<KpiForm> getEvaluationForms() {
        return getFormsByType(KpiForm.FormType.EVALUATION);
    }

    public List<KpiForm> getEvaluationFormsByThematique(Long thematiqueId) {
        return kpiFormRepository.findAll().stream()
            .filter(form -> form.getFormType() == KpiForm.FormType.EVALUATION 
                && thematiqueId.equals(form.getThematiqueId()))
            .collect(Collectors.toList());
    }

    public List<KpiForm> getEvaluationFormsByCoach(Long coachId) {
        return kpiFormRepository.findAll().stream()
            .filter(form -> form.getFormType() == KpiForm.FormType.EVALUATION 
                && coachId.equals(form.getCoachId()))
            .collect(Collectors.toList());
    }

    public KpiForm getFormById(Long id) {
        return kpiFormRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Form not found"));
    }

    @Transactional
    public KpiForm createForm(KpiForm form) {
        if (form.getQuestions() != null) {
            for (int i = 0; i < form.getQuestions().size(); i++) {
                KpiFormQuestion q = form.getQuestions().get(i);
                q.setForm(form);
                q.setOrderIndex(i);
            }
        }
        return kpiFormRepository.save(form);
    }

    @Transactional
    public KpiForm updateForm(Long id, KpiForm updatedForm) {
        KpiForm existing = getFormById(id);
        existing.setTitle(updatedForm.getTitle());
        existing.setDescription(updatedForm.getDescription());
        existing.setProgrammeId(updatedForm.getProgrammeId());
        existing.setThematiqueId(updatedForm.getThematiqueId());
        existing.setCoachId(updatedForm.getCoachId());
        existing.setFormType(updatedForm.getFormType());
        existing.setDeadline(updatedForm.getDeadline());

        existing.getQuestions().clear();
        if (updatedForm.getQuestions() != null) {
            for (int i = 0; i < updatedForm.getQuestions().size(); i++) {
                KpiFormQuestion q = updatedForm.getQuestions().get(i);
                q.setForm(existing);
                q.setOrderIndex(i);
                existing.getQuestions().add(q);
            }
        }

        return kpiFormRepository.save(existing);
    }

    @Transactional
    public void deleteForm(Long id) {
        kpiFormRepository.deleteById(id);
    }

    @Transactional
    public void sendFormToEntrepreneurs(Long formId, List<Long> entrepreneurIds) {
        KpiForm form = getFormById(formId);
        
        List<User> entrepreneurs = userRepository.findAllById(entrepreneurIds);

        for (User entrepreneur : entrepreneurs) {
            // Check if already sent
            boolean alreadySent = form.getResponses().stream()
                .anyMatch(r -> r.getEntrepreneurId().equals(entrepreneur.getId()));
                
            if (!alreadySent) {
                KpiFormResponse response = new KpiFormResponse();
                response.setForm(form);
                response.setEntrepreneurId(entrepreneur.getId());
                response.setEntrepreneurName(entrepreneur.getFirstName() + " " + entrepreneur.getLastName());
                response.setStatus(KpiFormResponse.ResponseStatus.PENDING);
                
                kpiFormResponseRepository.save(response);
            }
        }
        
        form.setStatus(KpiForm.KpiFormStatus.SENT);
        kpiFormRepository.save(form);
    }

    public List<KpiFormResponse> getResponsesForForm(Long formId) {
        return kpiFormResponseRepository.findByFormId(formId);
    }

    public List<KpiFormResponse> getPendingFormsForEntrepreneur(Long entrepreneurId) {
        return kpiFormResponseRepository.findByEntrepreneurId(entrepreneurId).stream()
                .filter(r -> r.getStatus() == KpiFormResponse.ResponseStatus.PENDING)
                .collect(Collectors.toList());
    }

    @Transactional
    public KpiFormResponse submitResponse(Long responseId, List<KpiFormAnswer> answers) {
        KpiFormResponse response = kpiFormResponseRepository.findById(responseId)
            .orElseThrow(() -> new IllegalArgumentException("Response not found"));
            
        KpiForm form = response.getForm();
        
        // Validate form type
        if (form.getFormType() == null) {
            form.setFormType(KpiForm.FormType.KPI);
        }
        
        // Process answers based on form type
        if (form.getFormType() == KpiForm.FormType.KPI) {
            // KPI Form: Update KPI values and create history
            for (KpiFormAnswer answer : answers) {
                answer.setResponse(response);
                
                // Auto Update KPI if the question is linked to one
                if (answer.getKpiId() != null && form.getProgrammeId() != null) {
                    try {
                        // Update the entrepreneur value and create history entry
                        programmeKpiService.updateEntrepreneurValue(
                            form.getProgrammeId(), 
                            answer.getKpiId(), 
                            response.getEntrepreneurId(), 
                            null, 
                            answer.getAnswerValue(), 
                            null
                        );
                    } catch (Exception e) {
                        System.err.println("Could not update KPI " + answer.getKpiId() + ": " + e.getMessage());
                    }
                }
            }
        } else if (form.getFormType() == KpiForm.FormType.EVALUATION) {
            // Evaluation Form: Just store answers, no KPI update
            // Validate that evaluation forms don't have KPI associations
            for (KpiFormAnswer answer : answers) {
                answer.setResponse(response);
                
                // Log warning if a KPI question is somehow in an evaluation form
                if (answer.getKpiId() != null) {
                    System.out.println("Warning: KPI association found in EVALUATION form (Form: " + form.getId() + ", Question: " + answer.getQuestion().getId() + ")");
                }
            }
        }
        
        response.getAnswers().clear();
        response.getAnswers().addAll(answers);
        response.setStatus(KpiFormResponse.ResponseStatus.SUBMITTED);
        response.setSubmittedAt(LocalDateTime.now());
        
        return kpiFormResponseRepository.save(response);
    }
}
