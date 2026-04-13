package com.example.be.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.be.entity.User;
import com.example.be.entity.UserRole;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);
    
    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
    
    List<User> findByRole(UserRole role);
    
    List<User> findByIsActiveTrue();

    List<User> findByIsActiveTrueAndRoleNot(UserRole role);
}
