package team.project.redboost.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SessionCoachDTO {
    private Long id;
    private Long disponibiliteId;
    private String titre;
    private LocalDate dateSession;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private String typeSession; // EN_LIGNE or PRESENTIEL
    private String sessionGroupId; // Groups related créneaux under the same logical session
    private String thematiqueNom;
    private String programmeNom;
    private Boolean isBooked;
    private Boolean isBookedByMe;
    private Boolean isGroupReservedByMe;
    private String meetLink;
    private String couleur;
    private Boolean isExceptionnelle;
    private String bookingStatus;
}
