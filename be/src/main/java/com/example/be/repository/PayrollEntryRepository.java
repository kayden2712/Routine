package com.example.be.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.be.entity.PayrollEntry;

@Repository
public interface PayrollEntryRepository extends JpaRepository<PayrollEntry, Long> {
}
