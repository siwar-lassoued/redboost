package team.project.redboost.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.config.ValidationException;
import team.project.redboost.dto.*;
import team.project.redboost.entities.*;
import team.project.redboost.repositories.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
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
    private TacheDocumentRepository tacheDocumentRepository;

    @Autowired
    private NoteDeSyntheseRepository noteRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ProgrammeRepository programmeRepository;

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private CandidatureRedstarterRepository candidatureRepository;

    

    public DashboardStatsDTO getDashboardStats(Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        int nbProjet = matchings.size();
        
        List<Session> bookedSessions = sessionRepository.findByCoachId(coachId);
        List<SeanceExceptionnelle> seances = seanceExceptionnelleRepository.findByCoachId(coachId);
        int nbRendezVous = bookedSessions.size() + seances.size();
        
        long nbTaches = 0;
        int completedTaches = 0;
        int totalTaches = 0;
        for (Matching m : matchings) {
            CandidatureRedstarter cand = candidatureRepository.findById(m.getEntrepreneurId()).orElse(null);
            if (cand == null || cand.getEmail() == null) continue;
            User ent = userRepository.findByEmail(cand.getEmail());
            if (ent == null) continue;

            List<Tache> tasks = tacheRepository.findByResponsableId(ent.getId());
            totalTaches += tasks.size();
            for (Tache t : tasks) {
                if (t.getStatus() != Tache.StatusTache.TERMINEE) {
                    nbTaches++;
                } else {
                    completedTaches++;
                }
            }
        }
        
        double completionRate = totalTaches > 0 ? ((double) completedTaches / totalTaches) * 100 : 0.0;
        
        List<DashboardStatsDTO.ActivityDTO> activities = new ArrayList<>();
        
        return DashboardStatsDTO.builder()
                .nbProjet(nbProjet)
                .nbRendezVous(nbRendezVous)
                .nbTaches((int)nbTaches)
                .nbPhases(nbProjet * 2) // Mock
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .activity(activities)
                .build();
    }

    public List<CoachEntrepreneurDTO> getCoachEntrepreneurs(Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        
        Set<Long> seenIds = new HashSet<>();
        
        return matchings.stream()
            .filter(m -> seenIds.add(m.getEntrepreneurId()))
            .map(m -> {
                CandidatureRedstarter cand = candidatureRepository.findById(m.getEntrepreneurId()).orElse(null);
                if (cand == null || cand.getEmail() == null) return null;
                
                User ent = userRepository.findByEmail(cand.getEmail());
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
                    .entreprise("Non spécifié".equals(ent.getEntreprise()) ? (ent.getStartupName() != null ? ent.getStartupName() : "") : ent.getEntreprise())
                    .secteur("Non spécifié".equals(ent.getSecteur()) ? (ent.getIndustry() != null ? ent.getIndustry() : "") : ent.getSecteur())
                    .profilePictureUrl(ent.getProfilePictureUrl())
                    .completionRate(progress)
                    .delayedTasksCount((int)delayed)
                    .build();
        })
        .filter(dto -> dto != null)
        .collect(Collectors.toList());
    }

    /**
     * Returns matched entrepreneurs grouped by thématique for the coach profile page.
     * Each group contains the thématique info and the list of entrepreneurs matched in it.
     */
    public List<Map<String, Object>> getMatchedEntrepreneursGroupedByThematique(Long coachId) {
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatutAndThematiqueIdNotNull(
                coachId, Matching.StatutMatching.VALIDE);

        // Group matchings by thematiqueId
        Map<Long, List<Matching>> grouped = matchings.stream()
                .collect(Collectors.groupingBy(Matching::getThematiqueId));

        List<Map<String, Object>> result = new ArrayList<>();

        for (Map.Entry<Long, List<Matching>> entry : grouped.entrySet()) {
            Long thematiqueId = entry.getKey();
            List<Matching> themMatchings = entry.getValue();

            Map<String, Object> group = new LinkedHashMap<>();
            group.put("thematiqueId", thematiqueId);

            // Resolve thématique name
            ThematiqueCoaching thematique = thematiqueRepository.findById(thematiqueId).orElse(null);
            group.put("thematiqueName", thematique != null ? thematique.getNom() : "Thématique #" + thematiqueId);
            group.put("thematiqueStatut", thematique != null ? thematique.getStatut().name() : "UNKNOWN");

            // Build entrepreneur list for this thématique
            List<Map<String, Object>> entrepreneurs = new ArrayList<>();
            Set<Long> seenEntIds = new HashSet<>();

            for (Matching m : themMatchings) {
                if (!seenEntIds.add(m.getEntrepreneurId())) continue;

                CandidatureRedstarter cand = candidatureRepository.findById(m.getEntrepreneurId()).orElse(null);
                if (cand == null || cand.getEmail() == null) continue;

                User ent = userRepository.findByEmail(cand.getEmail());
                if (ent == null) continue;

                Map<String, Object> entMap = new LinkedHashMap<>();
                entMap.put("id", ent.getId());
                entMap.put("firstName", ent.getFirstName());
                entMap.put("lastName", ent.getLastName());
                entMap.put("email", ent.getEmail());
                entMap.put("phoneNumber", ent.getPhoneNumber());
                entMap.put("entreprise", ent.getEntreprise());
                entMap.put("secteur", ent.getSecteur());
                entMap.put("matchingId", m.getId());
                entrepreneurs.add(entMap);
            }

            group.put("entrepreneurs", entrepreneurs);
            group.put("count", entrepreneurs.size());
            result.add(group);
        }

        return result;
    }
    public List<CoachCalendarEventDTO> getCalendarEvents(Long coachId) {
        List<CoachCalendarEventDTO> events = new ArrayList<>();

        sessionCoachRepository.findByDisponibiliteCoachId(coachId).forEach(s -> events.add(
                CoachCalendarEventDTO.builder()
                        .id("slot-" + s.getId())
                        .type("SESSION_SLOT")
                        .title(s.getTitre())
                        .date(String.valueOf(s.getDateSession()))
                        .startTime(String.valueOf(s.getHeureDebut()))
                        .endTime(String.valueOf(s.getHeureFin()))
                        .source("coach")
                        .build()
        ));

        sessionRepository.findByCoachId(coachId).forEach(s -> events.add(
                CoachCalendarEventDTO.builder()
                        .id("session-" + s.getId())
                        .type("SESSION")
                        .title(s.getTitre())
                        .date(String.valueOf(s.getDate().toLocalDate()))
                        .startTime(String.valueOf(s.getDate().toLocalTime()))
                        .source("entrepreneur")
                        .build()
        ));

        seanceExceptionnelleRepository.findByCoachId(coachId).forEach(s -> events.add(
                CoachCalendarEventDTO.builder()
                        .id("seance-" + s.getId())
                        .type("SEANCE_EXCEPTIONNELLE")
                        .title(s.getTitre())
                        .date(String.valueOf(s.getDateSeance()))
                        .startTime(String.valueOf(s.getHeureDebut()))
                        .endTime(String.valueOf(s.getHeureFin()))
                        .source("coach")
                        .build()
        ));

        events.sort(Comparator.comparing(CoachCalendarEventDTO::getDate));
        return events;
    }

    public List<UpcomingSessionDTO> getUpcomingSessions(Long coachId) {
        List<UpcomingSessionDTO> upcoming = new ArrayList<>();
        
        // Sessions from calendar
        List<Session> bookedSessions = sessionRepository.findByCoachId(coachId);
        for (Session s : bookedSessions) {
            if (!s.getDate().toLocalDate().isBefore(LocalDate.now())) {
                upcoming.add(UpcomingSessionDTO.builder()
                        .id(s.getId())
                        .entrepreneurName(s.getEntrepreneur().getFirstName() + " " + s.getEntrepreneur().getLastName())
                        .dateSession(s.getDate().toLocalDate())
                        .heureDebut(s.getDate().toLocalTime())
                        .statut("CONFIRMED")
                        .meetingLink(s.getMeetLink())
                        .build());
            }
        }
        
        // Exceptional sessions
        List<SeanceExceptionnelle> seances = seanceExceptionnelleRepository.findByCoachId(coachId);
        for (SeanceExceptionnelle s : seances) {
            if (!s.getDateSeance().isBefore(LocalDate.now())) {
                upcoming.add(UpcomingSessionDTO.builder()
                        .id(String.valueOf(s.getId()))
                        .entrepreneurName(s.getEntrepreneur().getFirstName() + " " + s.getEntrepreneur().getLastName())
                        .dateSession(s.getDateSeance())
                        .heureDebut(s.getHeureDebut())
                        .statut("PENDING")
                        .build());
            }
        }
        
        return upcoming.stream()
                .sorted((a, b) -> {
                    int dateCmp = a.getDateSession().compareTo(b.getDateSession());
                    if (dateCmp != 0) return dateCmp;
                    return a.getHeureDebut().compareTo(b.getHeureDebut());
                })
                .limit(5)
                .collect(Collectors.toList());
    }
    public CoachDashboardOverviewDTO getDashboardOverview(Long coachId) {
        return CoachDashboardOverviewDTO.builder()
                .stats(getDashboardStats(coachId))
                .entrepreneurs(getCoachEntrepreneurs(coachId))
                .sessions(getUpcomingSessions(coachId))
                .build();
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
                .map(t -> {
                    List<DocumentDTO> docDtos = tacheDocumentRepository.findByTacheId(t.getId()).stream()
                            .map(d -> DocumentDTO.builder()
                                    .id(d.getId())
                                    .nom(d.getNom())
                                    .cheminFichier(d.getCheminFichier())
                                    .typeFichier(d.getTypeFichier())
                                    .tailleFichier(d.getTailleFichier())
                                    .dateUpload(d.getDateUpload())
                                    .uploadedById(d.getUploadedById())
                                    .build())
                            .collect(Collectors.toList());
                    
                    return CoachEntrepreneurDetailDTO.TacheDTO.builder()
                        .id(t.getId())
                        .titre(t.getTitre())
                        .description(t.getDescription())
                        .status(t.getStatus().toString())
                        .dateLimite(t.getDateLimite() != null ? t.getDateLimite().toString() : null)
                        .documents(docDtos)
                        .build();
                })
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
    
    public List<DisponibiliteDTO> getDisponibilitesByCoach(Long coachId) {
        return disponibiliteRepository.findByCoachId(coachId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public DisponibiliteDTO addDisponibilite(Long coachId, Long thematiqueId, String couleur) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ValidationException("Coach non trouvé"));
        ThematiqueCoaching theme = thematiqueRepository.findById(thematiqueId)
                .orElseThrow(() -> new ValidationException("Thématique non trouvée"));

        Disponibilite dispo = Disponibilite.builder()
                .coach(coach)
                .thematique(theme)
                .dateDebut(theme.getDateDebut())
                .dateFin(theme.getDateFin())
                .couleur(couleur)
                .build();
                
        Disponibilite saved = disponibiliteRepository.save(dispo);
        return mapToDTO(saved);
    }
    
    @Transactional
    public void deleteDisponibilite(Long id) {
        sessionCoachRepository.deleteByDisponibiliteId(id);
        disponibiliteRepository.deleteById(id);
    }
    @Transactional
    public DisponibiliteDTO updateDisponibilite(Long disponibiliteId, Long thematiqueId) {
        Disponibilite disponibilite = disponibiliteRepository.findById(disponibiliteId)
                .orElseThrow(() -> new ValidationException("Disponibilité non trouvée"));
        ThematiqueCoaching theme = thematiqueRepository.findById(thematiqueId)
                .orElseThrow(() -> new ValidationException("Thématique non trouvée"));

        disponibilite.setThematique(theme);
        disponibilite.setDateDebut(theme.getDateDebut());
        disponibilite.setDateFin(theme.getDateFin());

        Disponibilite saved = disponibiliteRepository.save(disponibilite);
        return mapToDTO(saved);
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

        // Parse typeSession
        SessionCoach.TypeSession type = SessionCoach.TypeSession.EN_LIGNE;
        if (dto.getTypeSession() != null) {
            try { type = SessionCoach.TypeSession.valueOf(dto.getTypeSession()); } catch (Exception ignored) {}
        }

        // Use provided sessionGroupId or generate a new one (groups related créneaux under one session)
        String groupId = (dto.getSessionGroupId() != null && !dto.getSessionGroupId().isBlank())
                ? dto.getSessionGroupId()
                : java.util.UUID.randomUUID().toString();

        SessionCoach session = SessionCoach.builder()
                .disponibilite(dispo)
                .titre(dto.getTitre())
                .dateSession(sessionDate)
                .heureDebut(dto.getHeureDebut())
                .heureFin(dto.getHeureFin())
                .typeSession(type)
                .sessionGroupId(groupId)
                .build();

        SessionCoach saved = sessionCoachRepository.save(session);

        // Notify all entrepreneurs linked to this coach (matching VALIDE) about new slot
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(
                dispo.getCoach().getId(), Matching.StatutMatching.VALIDE);
        for (Matching m : matchings) {
            try {
                CandidatureRedstarter cand = candidatureRepository.findById(m.getEntrepreneurId()).orElse(null);
                if (cand != null && cand.getEmail() != null) {
                    User entUser = userRepository.findByEmail(cand.getEmail());
                    if (entUser != null) {
                        notificationService.createAndSendNotification(
                                entUser.getId(),
                                "Nouveau créneau disponible : \"" + dto.getTitre() + "\" le " + sessionDate,
                                "SESSION_SLOT_ADDED", saved.getId());
                    }
                }
            } catch (Exception e) {
                log.warn("Notification failed for entrepreneur candidature {}: {}", m.getEntrepreneurId(), e.getMessage());
            }
        }

        return mapToDTO(saved);
    }
    @Transactional
    public SessionCoachDTO updateSession(Long sessionId, SessionCoachDTO dto) {
        SessionCoach session = sessionCoachRepository.findById(sessionId)
                .orElseThrow(() -> new ValidationException("Session non trouvée"));

        Disponibilite dispo = session.getDisponibilite();
        LocalDate sessionDate = dto.getDateSession();
        if (sessionDate.isBefore(dispo.getDateDebut()) || sessionDate.isAfter(dispo.getDateFin())) {
            throw new ValidationException("La date de session doit être comprise entre " + dispo.getDateDebut() + " et " + dispo.getDateFin());
        }
        if (dto.getHeureDebut().isAfter(dto.getHeureFin())) {
            throw new ValidationException("L'heure de début doit être avant l'heure de fin");
        }

        session.setDateSession(sessionDate);
        session.setHeureDebut(dto.getHeureDebut());
        session.setHeureFin(dto.getHeureFin());
        if (dto.getTitre() != null && !dto.getTitre().isBlank()) {
            session.setTitre(dto.getTitre());
        }
        if (dto.getTypeSession() != null) {
            try {
                session.setTypeSession(SessionCoach.TypeSession.valueOf(dto.getTypeSession()));
            } catch (Exception ignored) {}
        }

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

        // Notify all ADMIN users
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == team.project.redboost.entities.Role.ADMIN)
                .forEach(admin -> {
                    try {
                        notificationService.createAndSendNotification(
                                admin.getId(),
                                "Nouvelle réclamation de " + coach.getFirstName() + " " + coach.getLastName()
                                        + " concernant " + entrepreneur.getFirstName() + " " + entrepreneur.getLastName(),
                                "RECLAMATION_NEW", saved.getId());
                        emailService.sendEmail(admin.getEmail(),
                                "[RedBoost] Nouvelle réclamation coach",
                                "Coach : " + coach.getFirstName() + " " + coach.getLastName()
                                        + "\nEntrepreneur : " + entrepreneur.getFirstName() + " " + entrepreneur.getLastName()
                                        + "\nSujet : " + dto.getSujet()
                                        + "\nDescription : " + dto.getDescription());
                    } catch (Exception e) {
                        log.warn("Admin notification for reclamation failed: {}", e.getMessage());
                    }
                });

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
        dto.setCouleur(d.getCouleur());
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
        dto.setTypeSession(s.getTypeSession() != null ? s.getTypeSession().name() : "EN_LIGNE");
        dto.setSessionGroupId(s.getSessionGroupId());
        if (s.getDisponibilite() != null && s.getDisponibilite().getThematique() != null) {
            dto.setThematiqueNom(s.getDisponibilite().getThematique().getNom());
            dto.setCouleur(s.getDisponibilite().getThematique().getCouleur() != null ? 
                           s.getDisponibilite().getThematique().getCouleur() : 
                           s.getDisponibilite().getCouleur());
        }

        List<team.project.redboost.entities.Session> bookings = sessionRepository.findAll().stream()
                .filter(b -> String.valueOf(s.getId()).equals(b.getDisponibiliteId()))
                .collect(java.util.stream.Collectors.toList());

        dto.setIsBooked(!bookings.isEmpty());
        if (!bookings.isEmpty()) {
            dto.setMeetLink(bookings.get(0).getMeetLink());
            dto.setIsExceptionnelle(bookings.get(0).getIsExceptionnelle());
        } else {
            dto.setIsExceptionnelle(false);
        }

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
        
        List<Matching> matchings = matchingRepository.findByCoachIdAndStatut(coachId, Matching.StatutMatching.VALIDE);
        Set<Long> programmeIds = matchings.stream()
                .map(Matching::getProgrammeId)
                .collect(Collectors.toSet());

        List<ProgrammeDTO> programmes = new ArrayList<>();
        for (Long pid : programmeIds) {
            Programme p = programmeRepository.findById(pid).orElse(null);
            if (p != null) {
                programmes.add(ProgrammeDTO.builder()
                        .id(p.getId())
                        .nom(p.getNom())
                        .annee(p.getAnnee())
                        .build());
            }
        }
        return programmes;
    }

    // --- BOOKING (entrepreneur reserves a coach session) ---

    @Transactional
    public Map<String, Object> bookSession(Long sessionCoachId, Long entrepreneurId, String notes) {
        SessionCoach sc = sessionCoachRepository.findByIdWithLock(sessionCoachId)
                .orElseThrow(() -> new ValidationException("Session non trouvée"));
        User entrepreneur = userRepository.findById(entrepreneurId)
                .orElseThrow(() -> new ValidationException("Entrepreneur non trouvé"));
        User coach = sc.getDisponibilite().getCoach();

        // Check if this specific slot (disponibiliteId) is already booked by ANYONE
        // We use findAll and filter because findByCoachIdAndDisponibiliteId might be tricky with nulls
        List<Session> slotBookings = sessionRepository.findAll().stream()
                .filter(s -> java.util.Objects.equals(String.valueOf(sc.getId()), s.getDisponibiliteId()))
                .filter(s -> s.getStatut() == Session.Statut.CONFIRME || s.getStatut() == Session.Statut.DEMANDE || s.getStatut() == Session.Statut.PLANIFIE)
                .collect(Collectors.toList());

        if (!slotBookings.isEmpty()) {
            boolean alreadyByMe = slotBookings.stream()
                    .anyMatch(s -> s.getEntrepreneur().getId().equals(entrepreneurId));
            if (alreadyByMe) {
                throw new ValidationException("Vous avez déjà réservé ce créneau.");
            } else {
                throw new ValidationException("Ce créneau est déjà réservé par un autre entrepreneur.");
            }
        }

        // Check if the entrepreneur has already booked another slot in the same session group
        if (sc.getSessionGroupId() != null) {
            boolean alreadyBookedInGroup = sessionRepository.findByCoachId(coach.getId()).stream()
                    .filter(s -> s.getEntrepreneur() != null && s.getEntrepreneur().getId().equals(entrepreneurId))
                    .filter(s -> s.getStatut() == Session.Statut.CONFIRME || s.getStatut() == Session.Statut.DEMANDE || s.getStatut() == Session.Statut.PLANIFIE)
                    .filter(s -> s.getDisponibiliteId() != null)
                    .anyMatch(s -> {
                        try {
                            Long slotId = Long.parseLong(s.getDisponibiliteId());
                            return sessionCoachRepository.findById(slotId)
                                    .map(c -> java.util.Objects.equals(c.getSessionGroupId(), sc.getSessionGroupId()))
                                    .orElse(false);
                        } catch (NumberFormatException e) {
                            return false;
                        }
                    });
            if (alreadyBookedInGroup) {
                throw new ValidationException("Vous avez déjà réservé un créneau pour cette session.");
            }
        }

        // Create the Session entity
        Session session = Session.builder()
                .titre(sc.getTitre())
                .description("Réservation pour session : " + sc.getTitre())
                .coach(coach)
                .entrepreneur(entrepreneur)
                .date(sc.getDateSession().atTime(sc.getHeureDebut()))
                .dureeMinutes((int) java.time.Duration.between(sc.getHeureDebut(), sc.getHeureFin()).toMinutes())
                .statut(Session.Statut.PLANIFIE)
                .bookingStatut(Session.BookingStatut.EN_ATTENTE)
                .bookePar(entrepreneur)
                .dateBooking(LocalDateTime.now())
                .disponibiliteId(String.valueOf(sc.getId()))
                .notesEntrepreneur(notes)
                .build();
        Session saved = sessionRepository.save(session);

     
        try {
            LocalDateTime start = sc.getDateSession().atTime(sc.getHeureDebut());
            LocalDateTime end   = sc.getDateSession().atTime(sc.getHeureFin());
            GoogleCalendarService.GoogleEventResult meetResult =
                    googleCalendarService.createMeetEvent(sc.getTitre(), start, end,
                            coach.getEmail(), entrepreneur.getEmail());
            if (meetResult != null) {
                saved.setGoogleEventId(meetResult.getEventId());
                saved.setMeetLink(meetResult.getMeetLink());
                saved = sessionRepository.save(saved);
                log.info("Google Meet created for session {}: {}", saved.getId(), meetResult.getMeetLink());
            }
        } catch (Exception e) {
            log.warn("Google Calendar event creation failed (non-blocking): {}", e.getMessage());
        }

  
        try {
            notificationService.createAndSendNotification(
                    coach.getId(),
                    entrepreneur.getFirstName() + " " + entrepreneur.getLastName() + " a réservé la session \"" + sc.getTitre() + "\"",
                    "SESSION_BOOKING", null);
            notificationService.createAndSendNotification(
                    entrepreneurId,
                    "Réservation confirmée pour \"" + sc.getTitre() + "\" avec " + coach.getFirstName() + " " + coach.getLastName(),
                    "SESSION_BOOKING", null);
        } catch (Exception e) {
            log.warn("Notification sending failed (non-blocking): {}", e.getMessage());
        }

        try {
            String meetLinkText = saved.getMeetLink() != null
                    ? "\n\nLien Google Meet : " + saved.getMeetLink()
                    : "";
            emailService.sendEmail(entrepreneur.getEmail(),
                    "Réservation de session confirmée",
                    "Bonjour " + entrepreneur.getFirstName() + ",\n\n" +
                    "Votre réservation pour la session \"" + sc.getTitre() + "\" le " + sc.getDateSession() +
                    " de " + sc.getHeureDebut() + " à " + sc.getHeureFin() + " est confirmée.\n\n" +
                    "Coach : " + coach.getFirstName() + " " + coach.getLastName() +
                    meetLinkText + "\n\nCordialement,\nRedBoost");
        } catch (Exception e) {
            log.warn("Email booking confirmation failed: {}", e.getMessage());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", saved.getId());
        result.put("status", "PLANIFIE");
        result.put("meetLink", saved.getMeetLink());
        result.put("googleEventId", saved.getGoogleEventId());
        return result;
    }

    @Transactional
    public Map<String, Object> rescheduleSession(String sessionId, LocalDateTime newDate, Long entrepreneurId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ValidationException("Session non trouvée"));

        if (!session.getEntrepreneur().getId().equals(entrepreneurId)) {
            throw new ValidationException("Vous ne pouvez pas reprogrammer cette session.");
        }

        session.setDate(newDate);
        session.setStatut(Session.Statut.DEMANDE);

        // Update Google Calendar: cancel old event, create new one
        if (session.getGoogleEventId() != null) {
            try {
                googleCalendarService.cancelCalendarEvent(session.getGoogleEventId());
                LocalDateTime end = newDate.plusMinutes(session.getDureeMinutes() != null ? session.getDureeMinutes() : 60);
                GoogleCalendarService.GoogleEventResult newEvent = googleCalendarService.createMeetEvent(
                        session.getTitre(),
                        newDate,
                        end,
                        session.getCoach().getEmail(),
                        session.getEntrepreneur().getEmail());
                if (newEvent != null) {
                    session.setMeetLink(newEvent.getMeetLink());
                    session.setGoogleEventId(newEvent.getEventId());
                }
            } catch (Exception e) {
                log.warn("Google Calendar reschedule failed for session {}: {}", sessionId, e.getMessage());
            }
        }

        sessionRepository.save(session);

        // Notify coach
        notificationService.createAndSendNotification(
                session.getCoach().getId(),
                session.getEntrepreneur().getFirstName() + " a demandé la reprogrammation de \"" + session.getTitre() + "\"",
                "SESSION_RESCHEDULE", null);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", session.getId());
        result.put("newDate", newDate.toString());
        result.put("status", "DEMANDE");
        return result;
    }

    public List<Map<String, Object>> getSessionBookings(Long sessionCoachId) {
        List<Session> sessions = sessionRepository.findByCoachIdAndDisponibiliteId(
                null, String.valueOf(sessionCoachId));
        // Get all sessions linked to this sessionCoach slot
        List<Session> allBookings = sessionRepository.findAll().stream()
                .filter(s -> String.valueOf(sessionCoachId).equals(s.getDisponibiliteId()))
                .collect(Collectors.toList());

        return allBookings.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sessionId", s.getId());
            m.put("entrepreneurId", s.getEntrepreneur().getId());
            m.put("entrepreneurName", s.getEntrepreneur().getFirstName() + " " + s.getEntrepreneur().getLastName());
            m.put("dateBooking", s.getDateBooking());
            m.put("statut", s.getBookingStatut().name());
            m.put("meetLink", s.getMeetLink());
            return m;
        }).collect(Collectors.toList());
    }

    // --- Available sessions for entrepreneur (from a specific coach) ---
    public List<SessionCoachDTO> getAvailableSessionsForEntrepreneur(Long coachId, Long entrepreneurUserId, Long thematiqueId) {
        log.info(" Recherche sessions pour entrepreneurId={} et coachId={}", entrepreneurUserId, coachId);
        
        User entrepreneur = userRepository.findById(entrepreneurUserId)
                .orElseThrow(() -> new ValidationException("Entrepreneur non trouvé"));
        
        String email = entrepreneur.getEmail();
        if (email == null) {
            log.warn(" Email non trouvé pour l'utilisateur {}", entrepreneurUserId);
            return Collections.emptyList();
        }
        email = email.trim().toLowerCase();

        // 1. Collect all thematique IDs where this entrepreneur is matched with this coach
        Set<Long> matchedThematiqueIds = new HashSet<>();
        boolean isMatchedWithThisCoach = false;
        
        // Find candidatures by email (using optimized repository method)
        List<CandidatureRedstarter> candidatures = candidatureRepository.findByEmail(email);
        log.info(" Nombre de candidatures trouvées pour email {}: {}", email, candidatures.size());
        
        List<Matching> allMatchings = new ArrayList<>();
        for (CandidatureRedstarter cand : candidatures) {
            allMatchings.addAll(matchingRepository.findByEntrepreneurIdAndStatut(cand.getId(), Matching.StatutMatching.VALIDE));
        }
        // Also check by direct User ID
        allMatchings.addAll(matchingRepository.findByEntrepreneurIdAndStatut(entrepreneurUserId, Matching.StatutMatching.VALIDE));
        
        log.info(" Nombre total de matchings VALIDE trouvés: {}", allMatchings.size());

        boolean hasGlobalMatching = false;
        for (Matching m : allMatchings) {
            if (m.getCoachId().equals(coachId)) {
                isMatchedWithThisCoach = true;
                if (m.getThematiqueId() != null) {
                    if (thematiqueId == null || m.getThematiqueId().equals(thematiqueId)) {
                        matchedThematiqueIds.add(m.getThematiqueId());
                        log.info("[DIAG] Thématique matchée trouvée: {}", m.getThematiqueId());
                    }
                } else {
                    if (thematiqueId == null) {
                        hasGlobalMatching = true;
                        log.info(" Matching GLOBAL trouvé");
                    }
                }
            }
        }

        if (!isMatchedWithThisCoach) {
            log.warn("[DIAG] Aucun matching VALIDE trouvé entre entrepreneur {} et coach {}", entrepreneurUserId, coachId);
            return Collections.emptyList();
        }

        final boolean finalHasGlobal = hasGlobalMatching || matchedThematiqueIds.isEmpty();


        List<SessionCoach> coachSessions = sessionCoachRepository.findByDisponibiliteCoachId(coachId);
        log.info(" Sessions totales futures pour le coach: {}", coachSessions.size());
        
        List<Session> bookedSessions = sessionRepository.findByCoachId(coachId).stream()
                .filter(s -> s.getStatut() == Session.Statut.CONFIRME || s.getStatut() == Session.Statut.DEMANDE || s.getStatut() == Session.Statut.PLANIFIE)
                .collect(Collectors.toList());
        
        Set<String> bookedSessionCoachIds = bookedSessions.stream()
                .map(Session::getDisponibiliteId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> myBookedSessionCoachIds = bookedSessions.stream()
                .filter(s -> s.getEntrepreneur() != null && s.getEntrepreneur().getId().equals(entrepreneurUserId))
                .map(Session::getDisponibiliteId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Also collect all sessionGroupIds already booked by this entrepreneur
        Set<String> myBookedGroupIds = new HashSet<>();
        for (Session booking : bookedSessions) {
            if (booking.getEntrepreneur() != null && booking.getEntrepreneur().getId().equals(entrepreneurUserId) && booking.getDisponibiliteId() != null) {
                try {
                    Long slotId = Long.parseLong(booking.getDisponibiliteId());
                    coachSessions.stream()
                            .filter(s -> s.getId().equals(slotId))
                            .map(SessionCoach::getSessionGroupId)
                            .filter(Objects::nonNull)
                            .forEach(myBookedGroupIds::add);
                } catch (NumberFormatException ignored) {}
            }
        }

        LocalDate today = LocalDate.now();

        return coachSessions.stream()
                .filter(s -> !s.getDateSession().isBefore(today))
                .filter(s -> {
                    if (finalHasGlobal) return true;
                    if (s.getDisponibilite() != null && s.getDisponibilite().getThematique() != null) {
                        Long stid = s.getDisponibilite().getThematique().getId();
                        boolean match = matchedThematiqueIds.contains(stid);
                        if (!match) {
                            log.info(" Session {} (Thématique {}) filtrée car ne correspond pas aux thématiques de l'entrepreneur ({})", 
                                    s.getId(), stid, matchedThematiqueIds);
                        }
                        return match;
                    }
                    return false;
                })
                .map(s -> {
                    SessionCoachDTO dto = mapToDTO(s);
                    String sid = String.valueOf(s.getId());
                    dto.setIsBooked(bookedSessionCoachIds.contains(sid));
                    dto.setIsBookedByMe(myBookedSessionCoachIds.contains(sid));
                    dto.setIsGroupReservedByMe(myBookedGroupIds.contains(s.getSessionGroupId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Returns available sessions GROUPED by sessionGroupId for the entrepreneur booking flow.
     * Each group represents one logical "session" (e.g. Session 1 – Pitch Deck) with its créneaux.
     * The group carries a flag indicating whether the entrepreneur has already reserved a slot in it.
     */
    public List<Map<String, Object>> getAvailableSessionsGrouped(Long coachId, Long entrepreneurUserId, Long thematiqueId) {
        // Reuse existing filtering logic
        List<SessionCoachDTO> available = getAvailableSessionsForEntrepreneur(coachId, entrepreneurUserId, thematiqueId);

        // Also fetch ALL slots for this coach (including booked ones) to determine per-session reservation status
        List<SessionCoach> allSlots = sessionCoachRepository.findByDisponibiliteCoachId(coachId);

        // Collect all sessionGroupIds already booked by this entrepreneur
        List<Session> myBookings = sessionRepository.findByCoachId(coachId).stream()
                .filter(s -> s.getEntrepreneur() != null && s.getEntrepreneur().getId().equals(entrepreneurUserId))
                .filter(s -> s.getStatut() == Session.Statut.CONFIRME || s.getStatut() == Session.Statut.DEMANDE || s.getStatut() == Session.Statut.PLANIFIE)
                .collect(Collectors.toList());

        Set<String> bookedGroupIds = new java.util.HashSet<>();
        for (Session booking : myBookings) {
            if (booking.getDisponibiliteId() != null) {
                try {
                    Long slotId = Long.parseLong(booking.getDisponibiliteId());
                    allSlots.stream()
                            .filter(s -> s.getId().equals(slotId))
                            .map(SessionCoach::getSessionGroupId)
                            .filter(Objects::nonNull)
                            .forEach(bookedGroupIds::add);
                } catch (NumberFormatException ignored) {}
            }
        }

        // Group available slots by sessionGroupId
        Map<String, List<SessionCoachDTO>> grouped = new java.util.LinkedHashMap<>();
        for (SessionCoachDTO slot : available) {
            String groupId = slot.getSessionGroupId();
            if (groupId == null) groupId = "ungrouped-" + slot.getId();
            grouped.computeIfAbsent(groupId, k -> new ArrayList<>()).add(slot);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<SessionCoachDTO>> entry : grouped.entrySet()) {
            String groupId = entry.getKey();
            List<SessionCoachDTO> slots = entry.getValue();
            slots.sort(Comparator.comparing(SessionCoachDTO::getDateSession)
                    .thenComparing(SessionCoachDTO::getHeureDebut));

            Map<String, Object> group = new java.util.LinkedHashMap<>();
            group.put("sessionGroupId", groupId);
            group.put("sessionTitle", slots.get(0).getTitre());
            group.put("reservedByMe", bookedGroupIds.contains(groupId));
            group.put("slots", slots);
            result.add(group);
        }

        return result;
    }

    public CoachPlanningDTO getCoachPlanning(Long coachId) {
        // 1. Fetch all SessionCoach slots for this coach
        List<SessionCoach> slots = sessionCoachRepository.findByDisponibiliteCoachId(coachId);

        // 2. Fetch all Sessions (bookings) for this coach
        List<Session> allBookings = sessionRepository.findByCoachId(coachId);

        // 3. Fetch exceptional sessions
        List<SeanceExceptionnelle> exceptionals = seanceExceptionnelleRepository.findByCoachId(coachId);

        LocalDate today = LocalDate.now();

        // Map slot ID → bookings
        Map<Long, List<Session>> bookingsBySlotId = allBookings.stream()
                .filter(s -> s.getDisponibiliteId() != null)
                .collect(Collectors.groupingBy(s -> {
                    try { return Long.parseLong(s.getDisponibiliteId()); }
                    catch (NumberFormatException e) { return -1L; }
                }));

        // Build SlotWithBookings
        List<CoachPlanningDTO.SlotWithBookings> slotDTOs = slots.stream().map(slot -> {
                    List<Session> slotBookings = bookingsBySlotId.getOrDefault(slot.getId(), List.of());

                    List<CoachPlanningDTO.BookingInfo> bookingInfos = slotBookings.stream().map(s -> {
                        User ent = s.getEntrepreneur();
                        return CoachPlanningDTO.BookingInfo.builder()
                                .sessionId(s.getId())
                                .entrepreneurId(ent != null ? ent.getId() : null)
                                .entrepreneurName(ent != null ? ent.getFirstName() + " " + ent.getLastName() : "Inconnu")
                                .entrepreneurEmail(ent != null ? ent.getEmail() : null)
                                .statut(s.getStatut() != null ? s.getStatut().name() : "CONFIRME")
                                .meetLink(s.getMeetLink())
                                .notesEntrepreneur(s.getNotesEntrepreneur())
                                .build();
                    }).collect(Collectors.toList());

                    String thematiqueName = null;
                    Long thematiqueId = null;
                    if (slot.getDisponibilite() != null && slot.getDisponibilite().getThematique() != null) {
                        thematiqueName = slot.getDisponibilite().getThematique().getNom();
                        thematiqueId = slot.getDisponibilite().getThematique().getId();
                    }

                    return CoachPlanningDTO.SlotWithBookings.builder()
                            .slotId(slot.getId())
                            .titre(slot.getTitre())
                            .dateSession(slot.getDateSession())
                            .heureDebut(slot.getHeureDebut())
                            .heureFin(slot.getHeureFin())
                            .typeSession(slot.getTypeSession() != null ? slot.getTypeSession().name() : "EN_LIGNE")
                            .thematique(thematiqueName)
                            .thematiqueId(thematiqueId)
                            .bookings(bookingInfos)
                            .isBooked(!bookingInfos.isEmpty())
                            .build();
                }).sorted(Comparator.comparing(CoachPlanningDTO.SlotWithBookings::getDateSession)
                        .thenComparing(CoachPlanningDTO.SlotWithBookings::getHeureDebut))
                .collect(Collectors.toList());

        // Build ExceptionalSessionDTOs
        List<CoachPlanningDTO.ExceptionalSessionDTO> exceptionalDTOs = exceptionals.stream().map(s -> {
                    User ent = s.getEntrepreneur();
                    return CoachPlanningDTO.ExceptionalSessionDTO.builder()
                            .id(s.getId())
                            .titre(s.getTitre())
                            .dateSeance(s.getDateSeance())
                            .heureDebut(s.getHeureDebut())
                            .heureFin(s.getHeureFin())
                            .entrepreneurId(ent != null ? ent.getId() : null)
                            .entrepreneurName(ent != null ? ent.getFirstName() + " " + ent.getLastName() : "Inconnu")
                            .typeSession(s.getTypeSession() != null ? s.getTypeSession().name() : "EN_LIGNE")
                            .build();
                }).sorted(Comparator.comparing(CoachPlanningDTO.ExceptionalSessionDTO::getDateSeance)
                        .thenComparing(CoachPlanningDTO.ExceptionalSessionDTO::getHeureDebut))
                .collect(Collectors.toList());

        // Stats
        long bookedCount = slotDTOs.stream().filter(CoachPlanningDTO.SlotWithBookings::isBooked).count();
        long upcomingCount = slotDTOs.stream()
                .filter(s -> !s.getDateSession().isBefore(today)).count();
        upcomingCount += exceptionalDTOs.stream()
                .filter(s -> !s.getDateSeance().isBefore(today)).count();

        CoachPlanningDTO.PlanningStats stats = CoachPlanningDTO.PlanningStats.builder()
                .totalSlots(slotDTOs.size())
                .bookedSlots((int) bookedCount)
                .exceptionalCount(exceptionalDTOs.size())
                .upcomingCount((int) upcomingCount)
                .build();

        return CoachPlanningDTO.builder()
                .slots(slotDTOs)
                .exceptional(exceptionalDTOs)
                .stats(stats)
                .build();
    }
}
