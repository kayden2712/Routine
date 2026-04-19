package com.example.be.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.be.entity.User;
import com.example.be.entity.UserRole;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);
    
    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
    
    @Query(value = "SELECT * FROM users u WHERE u.role LIKE CONCAT('%', :roleName, '%')", nativeQuery = true)
    List<User> findByRolesContaining(@Param("roleName") String roleName);
    
    List<User> findByIsActiveTrue();

    @Query(value = "SELECT * FROM users u WHERE u.is_active = true AND u.role NOT LIKE CONCAT('%', :roleName, '%')", nativeQuery = true)
    List<User> findByIsActiveTrueAndRolesNotContaining(@Param("roleName") String roleName);

    default List<User> findByRole(UserRole role) {
        return findByRolesContaining(role.name());
    }

    default List<User> findByIsActiveTrueAndRoleNot(UserRole role) {
        return findByIsActiveTrueAndRolesNotContaining(role.name());
    }
}
