package team.project.redboost.services;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;

@Service
public class FirebaseService {
    public FirebaseToken verifyIdToken(String idToken) throws Exception {
        if (FirebaseApp.getApps().isEmpty()) {
            throw new RuntimeException("Firebase not configured on this server.");
        }
        return FirebaseAuth.getInstance().verifyIdToken(idToken);
    }
}