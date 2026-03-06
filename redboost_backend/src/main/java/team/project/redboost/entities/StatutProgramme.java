package team.project.redboost.entities;

public enum StatutProgramme {
    NON_DEMARREE("Non démarrée"),
    EN_COURS("En cours"),
    EN_RETARD("En retard"),
    COMPLETE("Complété");

    private final String label;

    StatutProgramme(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}