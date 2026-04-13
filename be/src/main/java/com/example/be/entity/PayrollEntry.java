package com.example.be.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "payroll_entries", indexes = {
    @Index(name = "idx_payroll_entry_payroll", columnList = "payroll_id"),
    @Index(name = "idx_payroll_entry_employee", columnList = "employee_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PayrollEntry extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", nullable = false)
    private Payroll payroll;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "employee_type", nullable = false, length = 20)
    private EmployeeType employeeType;

    @Column(name = "base_salary", precision = 15, scale = 2)
    private BigDecimal baseSalary;

    @Column(name = "hours_worked")
    private Integer hoursWorked;

    @Column(name = "hourly_rate", precision = 15, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "gross_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal grossSalary = BigDecimal.ZERO;

    @Column(name = "bonus_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal bonusAmount = BigDecimal.ZERO;

    @Column(name = "penalty_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    @Column(name = "net_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal netSalary = BigDecimal.ZERO;
}
