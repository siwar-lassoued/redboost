package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Role;
import team.project.redboost.entities.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByRoleIn(List<Role> roles);

    Optional<User> findByResetToken(String resetToken);

    User findByProviderId(String providerId);

    long countByRole(Role role);
}