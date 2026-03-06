package team.project.redboost.config;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)  // Automatically returns 400
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }
}