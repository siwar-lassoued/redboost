package team.project.redboost.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

public class MessageDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private String id;
    private String expediteurId;
    private String expediteurNom;
    private String expediteurPrenom;
    private String expediteurPhotoUrl;
    private String destinataireId;
    private String contenu;
    private String type;          // TEXT | FILE | CALL
    private boolean lu;

    // File-specific fields
    private String fichierUrl;
    private String fichierNom;
    private String fichierType;
    private Long   fichierTaille;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime sentAt;

    public MessageDTO() {}

    public MessageDTO(String id, String expediteurId, String expediteurNom,
                      String expediteurPrenom, String expediteurPhotoUrl,
                      String destinataireId, String contenu,
                      String type, boolean lu, LocalDateTime sentAt,
                      String fichierUrl, String fichierNom, String fichierType, Long fichierTaille) {
        this.id                 = id;
        this.expediteurId       = expediteurId;
        this.expediteurNom      = expediteurNom;
        this.expediteurPrenom   = expediteurPrenom;
        this.expediteurPhotoUrl = expediteurPhotoUrl;
        this.destinataireId     = destinataireId;
        this.contenu            = contenu;
        this.type               = type;
        this.lu                 = lu;
        this.sentAt             = sentAt;
        this.fichierUrl         = fichierUrl;
        this.fichierNom         = fichierNom;
        this.fichierType        = fichierType;
        this.fichierTaille      = fichierTaille;
    }

    // Getters / Setters
    public String getId()                          { return id; }
    public void setId(String v)                    { this.id = v; }
    public String getExpediteurId()                { return expediteurId; }
    public void setExpediteurId(String v)          { this.expediteurId = v; }
    public String getExpediteurNom()               { return expediteurNom; }
    public void setExpediteurNom(String v)         { this.expediteurNom = v; }
    public String getExpediteurPrenom()            { return expediteurPrenom; }
    public void setExpediteurPrenom(String v)      { this.expediteurPrenom = v; }
    public String getExpediteurPhotoUrl()          { return expediteurPhotoUrl; }
    public void setExpediteurPhotoUrl(String v)    { this.expediteurPhotoUrl = v; }
    public String getDestinataireId()               { return destinataireId; }
    public void setDestinataireId(String v)         { this.destinataireId = v; }
    public String getContenu()                     { return contenu; }
    public void setContenu(String v)               { this.contenu = v; }
    public String getType()                        { return type; }
    public void setType(String v)                  { this.type = v; }
    public boolean isLu()                          { return lu; }
    public void setLu(boolean v)                   { this.lu = v; }
    public String getFichierUrl()                  { return fichierUrl; }
    public void setFichierUrl(String v)            { this.fichierUrl = v; }
    public String getFichierNom()                  { return fichierNom; }
    public void setFichierNom(String v)            { this.fichierNom = v; }
    public String getFichierType()                 { return fichierType; }
    public void setFichierType(String v)           { this.fichierType = v; }
    public Long getFichierTaille()                 { return fichierTaille; }
    public void setFichierTaille(Long v)           { this.fichierTaille = v; }
    public LocalDateTime getSentAt()               { return sentAt; }
    public void setSentAt(LocalDateTime v)         { this.sentAt = v; }
}
