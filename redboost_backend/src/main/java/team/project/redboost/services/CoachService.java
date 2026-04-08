package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.config.ValidationException;
import team.project.redboost.dto.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CoachService {

    @Autowired
    private DisponibiliteRepository disponibiliteRepository;
    
    @Autowired
    private SessionCoachRepository sessionCoachRepository;
    
    @Autowired
    private SeanceExceptionnelleRepository seanceExceptionnelleRepository;
    
    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ThematiqueRepository thematiqueRepository;

    @Autowired
    private MatchingRepository matchingRepository;

    @Autowired
    private TacheRepository tacheRepository;

    @Autowired
    private NoteDeSyntheseRepository noteRepository;

    @Autowired
    private TacheDocumentRepository tacheDocumentRepository;

    // --- DASHBOARD OVERVIEW ---

    public DashboardStatsDTO getDashboardStats(Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        int nbProjet = matchings.size();
        
        List<SessionCoach> sessions = sessionCoachRepository.findByDisponibiliteCoachId(coachId);
        List<SeanceExceptionnelle> seances = seanceExceptionnelleRepository.findByCoachId(coachId);
        int nbRendezVous = sessions.size() + seances.size();
        
        long nbTaches = 0;
        for (Matching m : matchings) {
            nbTaches += tacheRepository.findByResponsableId(m.getEntrepreneurId()).stream()
                    .filter(t -> t.getStatus() != Tache.StatusTache.TERMINEE)
                    .count();
        }
        
        // Activity log mockup
        List<DashboardStatsDTO.ActivityDTO> activities = new ArrayList<>();
        activities.add(DashboardStatsDTO.ActivityDTO.builder()
                .time("Il y a 2h")
                .text("Nouvelle session planifiée avec Rania")
                .build());
        
        return DashboardStatsDTO.builder()
                .nbProjet(nbProjet)
                .nbRendezVous(nbRendezVous)
                .nbTaches((int)nbTaches)
                .nbPhases(nbProjet * 2) // Mock
                .completionRate(87.0)
                .activity(activities)
                .build();
    }

    public List<CoachEntrepreneurDTO> getCoachEntrepreneurs(Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        
        return matchings.stream().map(m -> {
            User ent = userRepository.findById(m.getEntrepreneurId()).orElse(null);
            if (ent == null) return null;
            
            List<Tache> tasks = tacheRepository.findByResponsableId(ent.getId());
            long total = tasks.size();
            long done = tasks.stream().filter(t -> t.getStatus() == Tache.StatusTache.TERMINEE).count();
            int progress = total > 0 ? (int)(done * 100 / total) : 0;
            
            long delayed = tasks.stream()
                    .filter(t -> t.getStatus() != Tache.StatusTache.TERMINEE 
                              && t.getDateLimite() != null 
                              && t.getDateLimite().isBefore(LocalDate.now()))
                    .count();
            
            return CoachEntrepreneurDTO.builder()
                    .id(ent.getId())
                    .firstName(ent.getFirstName())
                    .lastName(ent.getLastName())
                    .entreprise(ent.getEntreprise())
                    .secteur(ent.getSecteur())
                    .profilePictureUrl(ent.getProfilePictureUrl())
                    .completionRate(progress)
                    .delayedTasksCount((int)delayed)
                    .build();
        })
        .filter(dto -> dto != null)
        .collect(Collectors.toList());
    }

    public List<UpcomingSessionDTO> getUpcomingSessions(Long coachId) {
        List<UpcomingSessionDTO> upcoming = new ArrayList<>();
        
        // Sessions from calendar
        List<SessionCoach> sessions = sessionCoachRepository.findByDisponibiliteCoachId(coachId);
        for (SessionCoach s : sessions) {
            if (!s.getDateSession().isBefore(LocalDate.now())) {
                upcoming.add(UpcomingSessionDTO.builder()
                        .id(s.getId())
                        .entrepreneurName("Session " + (s.getDisponibilite() != null ? s.getDisponibilite().getThematique().getNom() : "Coaching"))
                        .dateSession(s.getDateSession())
                        .heureDebut(s.getHeureDebut())
                        .statut("CONFIRMED")
                        .build());
            }
        }
        
        // Exceptional sessions
        List<SeanceExceptionnelle> seances = seanceExceptionnelleRepository.findByCoachId(coachId);
        for (SeanceExceptionnelle s : seances) {
            if (!s.getDateSeance().isBefore(LocalDate.now())) {
                upcoming.add(UpcomingSessionDTO.builder()
                        .id(s.getId())
                        .entrepreneurName(s.getEntrepreneur().getFirstName() + " " + s.getEntrepreneur().getLastName())
                        .dateSession(s.getDateSeance())
                        .heureDebut(s.getHeureDebut())
                        .statut("PENDING")
                        .build());
            }
        }
        
        return upcoming.stream()
                .sorted((a, b) -> a.getDateSession().compareTo(b.getDateSession()))
                .limit(5)
                .collect(Collectors.toList());
    }

    public CoachEntrepreneurDetailDTO getEntrepreneurDetail(Long coachId, Long entrepreneurId) {
        User ent = userRepository.findById(entrepreneurId)
                .orElseThrow(() -> new ValidationException("Entrepreneur non trouvé"));
        
        List<Tache> tasks = tacheRepository.findByResponsableId(entrepreneurId);
        
        List<CoachEntrepreneurDetailDTO.LivrableDTO> livrables = new ArrayList<>();
        for (Tache t : tasks) {
            List<TacheDocument> docs = tacheDocumentRepository.findByTacheId(t.getId());
            for (TacheDocument doc : docs) {
                livrables.add(CoachEntrepreneurDetailDTO.LivrableDTO.builder()
                        .id(doc.getId())
                        .nom(doc.getNom())
                        .dateUpload(doc.getDateUpload().toString())
                        .typeFichier(doc.getTypeFichier())
                        .tailleFichier(doc.getTailleFichier())
                        .url(doc.getCheminFichier())
                        .tacheTitre(t.getTitre())
                        .build());
            }
        }
        
        List<CoachEntrepreneurDetailDTO.NoteDeSyntheseDTO> notes = noteRepository.findByEntrepreneurId(entrepreneurId).stream()
                .map(n -> CoachEntrepreneurDetailDTO.NoteDeSyntheseDTO.builder()
                        .id(n.getId())
                        .date(n.getDateCreation().toString())
                        .synthese(n.getSynthese())
                        .appreciation(n.getAppreciation())
                        .build())
                .collect(Collectors.toList());
        
        long total = tasks.size();
        long done = tasks.stream().filter(t -> t.getStatus() == Tache.StatusTache.TERMINEE).count();
        int progress = total > 0 ? (int)(done * 100 / total) : 0;

        List<CoachEntrepreneurDetailDTO.TacheDTO> taskDtos = tasks.stream()
                .map(t -> CoachEntrepreneurDetailDTO.TacheDTO.builder()
                        .id(t.getId())
                        .titre(t.getTitre())
                        .description(t.getDescription())
                        .status(t.getStatus().toString())
                        .dateLimite(t.getDateLimite() != null ? t.getDateLimite().toString() : null)
                        .build())
                .collect(Collectors.toList());

        return CoachEntrepreneurDetailDTO.builder()
                .id(ent.getId())
                .firstName(ent.getFirstName())
                .lastName(ent.getLastName())
                .email(ent.getEmail())
                .phoneNumber(ent.getPhoneNumber())
                .entreprise(ent.getEntreprise())
                .secteur(ent.getSecteur())
                .profilePictureUrl(ent.getProfilePictureUrl())
                .startupDescription(ent.getBio())
                .completionRate(progress)
                .tasks(taskDtos)
                .livrables(livrables)
                .notes(notes)
                .build();
    }

    // --- DISPONIBILITE ---
    
    public List<DisponibiliteDTO> getDisponibilitesByCoach(Long coachId) {
        return disponibiliteRepository.findByCoachId(coachId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public DisponibiliteDTO addDisponibilite(Long coachId, Long thematiqueId) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ValidationException("Coach non trouvé"));
        ThematiqueCoaching theme = thematiqueRepository.findById(thematiqueId)
                .orElseThrow(() -> new ValidationException("Thématique non trouvée"));

        Disponibilite dispo = Disponibilite.builder()
                .coach(coach)
                .thematique(theme)
                .dateDebut(theme.getDateDebut())
                .dateFin(theme.getDateFin())
                .build();
                
        Disponibilite saved = disponibiliteRepository.save(dispo);
        return mapToDTO(saved);
    }
    
    public void deleteDisponibilite(Long id) {
        disponibiliteRepository.deleteById(id);
    }

    // --- SESSION COACH ---
    
    public List<SessionCoachDTO> getSessionsByDisponibilite(Long disponibiliteId) {
        return sessionCoachRepository.findByDisponibiliteId(disponibiliteId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    public List<SessionCoachDTO> getSessionsByCoach(Long coachId) {
        return sessionCoachRepository.findByDisponibiliteCoachId(coachId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public SessionCoachDTO addSession(Long disponibiliteId, SessionCoachDTO dto) {
        Disponibilite dispo = disponibiliteRepository.findById(disponibiliteId)
                .orElseThrow(() -> new ValidationException("Disponibilité non trouvée"));
                
        // Validation règle importante : les dates ne dépassent pas la plage
        LocalDate sessionDate = dto.getDateSession();
        if (sessionDate.isBefore(dispo.getDateDebut()) || sessionDate.isAfter(dispo.getDateFin())) {
            throw new ValidationException("La date de session doit être comprise entre " + dispo.getDateDebut() + " et " + dispo.getDateFin());
        }
        if (dto.getHeureDebut().isAfter(dto.getHeureFin())) {
            throw new ValidationException("L'heure de début doit être avant l'heure de fin");
        }

        SessionCoach session = SessionCoach.builder()
                .disponibilite(dispo)
                .titre(dto.getTitre())
                .dateSession(sessionDate)
                .heureDebut(dto.getHeureDebut())
                .heureFin(dto.getHeureFin())
                .build();

        SessionCoach saved = sessionCoachRepository.save(session);
        return mapToDTO(saved);
    }
    
    public void deleteSession(Long id) {
        sessionCoachRepository.deleteById(id);
    }

    // --- SEANCE EXCEPTIONNELLE ---
    
    public List<SeanceExceptionnelleDTO> getSeancesExceptionnellesByCoach(Long coachId) {
        return seanceExceptionnelleRepository.findByCoachId(coachId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public SeanceExceptionnelleDTO addSeanceExceptionnelle(Long coachId, Long entrepreneurId, SeanceExceptionnelleDTO dto) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ValidationException("Coach non trouvé"));
        User entrepreneur = userRepository.findById(entrepreneurId)
                .orElseThrow(() -> new ValidationException("Entrepreneur non trouvé"));

        if (dto.getHeureDebut().isAfter(dto.getHeureFin())) {
            throw new ValidationException("L'heure de début doit être avant l'heure de fin");
        }

        SeanceExceptionnelle seance = SeanceExceptionnelle.builder()
                .coach(coach)
                .entrepreneur(entrepreneur)
                .titre(dto.getTitre())
                .dateSeance(dto.getDateSeance())
                .heureDebut(dto.getHeureDebut())
                .heureFin(dto.getHeureFin())
                .build();

        SeanceExceptionnelle saved = seanceExceptionnelleRepository.save(seance);
        return mapToDTO(saved);
    }

    // --- RECLAMATION ---
    
    public List<ReclamationDTO> getReclamationsByCoach(Long coachId) {
        return reclamationRepository.findByCoachId(coachId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public ReclamationDTO addReclamation(Long coachId, Long entrepreneurId, ReclamationDTO dto) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ValidationException("Coach non trouvé"));
        User entrepreneur = userRepository.findById(entrepreneurId)
                .orElseThrow(() -> new ValidationException("Entrepreneur non trouvé"));

        Reclamation rec = Reclamation.builder()
                .coach(coach)
                .entrepreneur(entrepreneur)
                .sujet(dto.getSujet())
                .description(dto.getDescription())
                .build();

        Reclamation saved = reclamationRepository.save(rec);
        return mapToDTO(saved);
    }

    // --- MAPPERS ---
    
    private DisponibiliteDTO mapToDTO(Disponibilite d) {
        DisponibiliteDTO dto = new DisponibiliteDTO();
        dto.setId(d.getId());
        dto.setCoachId(d.getCoach().getId());
        dto.setThematiqueId(d.getThematique().getId());
        dto.setThematiqueNom(d.getThematique().getNom());
        dto.setDateDebut(d.getDateDebut());
        dto.setDateFin(d.getDateFin());
        return dto;
    }

    private SessionCoachDTO mapToDTO(SessionCoach s) {
        SessionCoachDTO dto = new SessionCoachDTO();
        dto.setId(s.getId());
        dto.setDisponibiliteId(s.getDisponibilite().getId());
        dto.setTitre(s.getTitre());
        dto.setDateSession(s.getDateSession());
        dto.setHeureDebut(s.getHeureDebut());
        dto.setHeureFin(s.getHeureFin());
        return dto;
    }

    private SeanceExceptionnelleDTO mapToDTO(SeanceExceptionnelle s) {
        SeanceExceptionnelleDTO dto = new SeanceExceptionnelleDTO();
        dto.setId(s.getId());
        dto.setCoachId(s.getCoach().getId());
        dto.setEntrepreneurId(s.getEntrepreneur().getId());
        dto.setEntrepreneurName(s.getEntrepreneur().getFirstName() + " " + s.getEntrepreneur().getLastName());
        dto.setTitre(s.getTitre());
        dto.setDateSeance(s.getDateSeance());
        dto.setHeureDebut(s.getHeureDebut());
        dto.setHeureFin(s.getHeureFin());
        return dto;
    }

    private ReclamationDTO mapToDTO(Reclamation r) {
        ReclamationDTO dto = new ReclamationDTO();
        dto.setId(r.getId());
        dto.setCoachId(r.getCoach().getId());
        dto.setEntrepreneurId(r.getEntrepreneur().getId());
        dto.setEntrepreneurName(r.getEntrepreneur().getFirstName() + " " + r.getEntrepreneur().getLastName());
        dto.setSujet(r.getSujet());
        dto.setDescription(r.getDescription());
        dto.setStatut(r.getStatut().name());
        dto.setDateReclamation(r.getDateReclamation());
        return dto;
    }

    public List<ProgrammeDTO> getCoachProgrammes(Long coachId) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach non trouvé"));
        
        return coach.getProgrammes().stream()
                .map(p -> ProgrammeDTO.builder()
                        .id(p.getId())
                        .nom(p.getNom())
                        .annee(p.getAnnee())
                        .build())
                .collect(Collectors.toList());
    }
}
