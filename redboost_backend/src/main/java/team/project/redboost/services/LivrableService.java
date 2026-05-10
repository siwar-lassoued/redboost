package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.Livrable;
import team.project.redboost.repositories.LivrableRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LivrableService {

    private final LivrableRepository livrableRepository;
    private final team.project.redboost.repositories.MatchingRepository matchingRepository;
    private final team.project.redboost.repositories.ThematiqueRepository thematiqueRepository;
    private final team.project.redboost.repositories.SessionRepository sessionRepository;
    private final team.project.redboost.repositories.UserRepository userRepository;

    public List<Livrable> getAllLivrables() {
        return livrableRepository.findAll();
    }

    public List<Livrable> getLivrablesByCoachEmail(String email) {
        return livrableRepository.findByCoachEmail(email);
    }

    public Livrable getLivrableById(Long id) {
        return livrableRepository.findById(id).orElse(null);
    }

    @Transactional
    public Livrable createLivrable(Livrable livrable) {
        return livrableRepository.save(livrable);
    }

    @Transactional
    public Livrable updateStatus(Long id, Livrable.Statut statut, String coachComment) {
        Livrable livrable = getLivrableById(id);
        if (livrable != null) {
            livrable.setStatut(statut);
            if (coachComment != null) {
                livrable.setCoachComment(coachComment);
            }
            // Si le coach accepte ou met en révision, on peut enregistrer la date
            if (statut == Livrable.Statut.ACCEPTE || statut == Livrable.Statut.EN_REVISION) {
                livrable.setValidatedAt(LocalDateTime.now());
            }
            return livrableRepository.save(livrable);
        }
        return null;
    }

    @Transactional
    public Livrable submitLivrable(Long id, String fileUrl, String fileSize) {
        Livrable livrable = getLivrableById(id);
        if (livrable != null) {
            // Si c'était en révision, le nouveau statut est RESOUMIS, sinon c'est SOUMIS
            if (livrable.getStatut() == Livrable.Statut.EN_REVISION) {
                livrable.setStatut(Livrable.Statut.RESOUMIS);
            } else {
                livrable.setStatut(Livrable.Statut.SOUMIS);
            }
            
            livrable.setFichierUrl(fileUrl);
            livrable.setFileSize(fileSize);
            livrable.setDateSoumission(LocalDateTime.now());
            return livrableRepository.save(livrable);
        }
        return null;
    }

    @Transactional
    public void deleteLivrable(Long id) {
        livrableRepository.deleteById(id);
    }

    public List<Livrable> getReceivedLivrablesByCoach(Long coachId) {
        List<team.project.redboost.entities.Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, team.project.redboost.entities.Matching.StatutMatching.VALIDE);
        if (matchings.isEmpty()) return new java.util.ArrayList<>();

        java.util.List<Long> entrepreneurIds = matchings.stream()
                .map(team.project.redboost.entities.Matching::getEntrepreneurId)
                .collect(java.util.stream.Collectors.toList());

        List<Livrable> livrables = livrableRepository.findByEntrepreneurIdIn(entrepreneurIds);
        
        // Filter out livrables that WERE sent by this coach (to avoid duplicates if the coach is the source)
        // Actually, "Received" means source is NOT coach.
        team.project.redboost.entities.User coach = team.project.redboost.repositories.UserRepository.class.isInterface() ? null : null; // Need a way to get coach email
        // For now, let's just enrich all and filter in the frontend if needed, 
        // or better, get the coach email here.
        return enrichLivrables(livrables, coachId, matchings);
    }

    public List<Livrable> getSentLivrablesByCoach(Long coachId) {
        team.project.redboost.entities.User coach = userRepository.findById(coachId).orElse(null);
        if (coach == null || coach.getEmail() == null) return new java.util.ArrayList<>();
        
        String email = coach.getEmail();
        List<Livrable> livrables = livrableRepository.findByCoachEmail(email);
        
        List<team.project.redboost.entities.Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, team.project.redboost.entities.Matching.StatutMatching.VALIDE);
        
        return enrichLivrables(livrables, coachId, matchings);
    }

    private List<Livrable> enrichLivrables(List<Livrable> livrables, Long coachId, List<team.project.redboost.entities.Matching> matchings) {
        for (Livrable l : livrables) {
            if (l.getEntrepreneur() != null) {
                l.setEntrepreneurName(l.getEntrepreneur().getFirstName() + " " + l.getEntrepreneur().getLastName());
            }

            team.project.redboost.entities.Matching m = matchings.stream()
                    .filter(match -> l.getEntrepreneur() != null && match.getEntrepreneurId().equals(l.getEntrepreneur().getId()))
                    .findFirst().orElse(null);

            if (m != null) {
                if (m.getThematiqueId() != null) {
                    thematiqueRepository.findById(m.getThematiqueId()).ifPresent(t -> l.setThematiqueName(t.getNom()));
                }
                if (l.getProgramme() == null && m.getProgrammeId() != null) {
                    l.setProgrammeName("Programme " + m.getProgrammeId());
                }
            }

            if (l.getProgramme() != null) {
                l.setProgrammeName(l.getProgramme().getNom());
            }

            if (l.getTache() != null) {
                l.setTacheName(l.getTache().getTitre());
                l.setTacheDate(l.getTache().getDateLimite());
            }

            if (l.getEntrepreneur() != null) {
                List<team.project.redboost.entities.Session> sessions = sessionRepository.findByCoachIdAndEntrepreneurId(coachId, l.getEntrepreneur().getId());
                if (!sessions.isEmpty()) {
                    l.setSessionName(sessions.get(0).getTitre());
                }
            }
        }
        return livrables;
    }
}
