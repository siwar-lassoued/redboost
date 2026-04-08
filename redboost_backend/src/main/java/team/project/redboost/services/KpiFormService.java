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
        
        for (KpiFormAnswer answer : answers) {
            answer.setResponse(response);
            
            // Auto Update KPI if the question is linked to one
            if (answer.getKpiId() != null && form.getProgrammeId() != null) {
                // Here we inject logic to update the BackofficeKpi via ProgrammeKpiService
                try {
                    // Update the entrepreneur value! The previous, actuelle, cible can be parsed depending on the KPI type.
                    // For simplicity, we send the answer as "valeurActuelle" and "valeurCible" empty
                    // In a progression kpi, they would only provide the delta or the new "valeurActuelle".
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
        
        response.getAnswers().clear();
        response.getAnswers().addAll(answers);
        response.setStatus(KpiFormResponse.ResponseStatus.SUBMITTED);
        response.setSubmittedAt(LocalDateTime.now());
        
        return kpiFormResponseRepository.save(response);
    }
}
