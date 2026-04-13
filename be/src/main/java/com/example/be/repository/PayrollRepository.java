package com.example.be.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.be.entity.Payroll;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    Optional<Payroll> findByMonthAndYear(Integer month, Integer year);

    @EntityGraph(attributePaths = { "entries", "entries.employee", "approvedBy" })
    Optional<Payroll> findWithEntriesById(Long id);

    @EntityGraph(attributePaths = { "entries", "entries.employee", "approvedBy" })
    List<Payroll> findByMonthAndYearOrderByCreatedAtDesc(Integer month, Integer year);

    @EntityGraph(attributePaths = { "entries", "entries.employee", "approvedBy" })
    List<Payroll> findTop20ByOrderByCreatedAtDesc();
}
