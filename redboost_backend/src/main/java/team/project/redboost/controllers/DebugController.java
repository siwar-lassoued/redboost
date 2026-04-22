package team.project.redboost.controllers;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@RestController
public class DebugController {
    @Autowired private JdbcTemplate jdbcTemplate;

    @GetMapping("/api/debug-db")
    public List<Map<String, Object>> debug() {
        return jdbcTemplate.queryForList("SELECT id, email, first_name, last_name, role FROM user WHERE role='ENTREPRENEUR'");
    }
    
    @GetMapping("/api/debug-cand")
    public List<Map<String, Object>> debugCand() {
        return jdbcTemplate.queryForList("SELECT id, email, nom_prenom FROM candidature_redstarter");
    }
    
    @GetMapping("/api/debug-match")
    public List<Map<String, Object>> debugMatch() {
        return jdbcTemplate.queryForList("SELECT id, coach_id, entrepreneur_id, statut FROM matching");
    }
}
