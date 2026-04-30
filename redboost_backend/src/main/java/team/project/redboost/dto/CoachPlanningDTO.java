package team.project.redboost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachPlanningDTO {
    private List<SlotWithBookings> slots;
    private List<ExceptionalSessionDTO> exceptional;
    private PlanningStats stats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotWithBookings {
        private Long slotId;
        private String titre;
        private LocalDate dateSession;
        private LocalTime heureDebut;
        private LocalTime heureFin;
        private String typeSession;
        private String thematique;
        private Long thematiqueId;
        private List<BookingInfo> bookings;
        private boolean isBooked;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingInfo {
        private String sessionId;
        private String entrepreneurName;
        private String entrepreneurEmail;
        private Long entrepreneurId;
        private String statut;
        private String meetLink;
        private String notesEntrepreneur;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExceptionalSessionDTO {
        private Long id;
        private String titre;
        private LocalDate dateSeance;
        private LocalTime heureDebut;
        private LocalTime heureFin;
        private String entrepreneurName;
        private Long entrepreneurId;
        private String typeSession;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanningStats {
        private int totalSlots;
        private int bookedSlots;
        private int exceptionalCount;
        private int upcomingCount;
    }
}
