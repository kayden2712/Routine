package com.example.be.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.be.entity.enums.PayrollStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "payrolls", uniqueConstraints = {
    @UniqueConstraint(name = "uk_payroll_month_year", columnNames = { "month", "year" })
}, indexes = {
    @Index(name = "idx_payroll_month_year", columnList = "month,year"),
    @Index(name = "idx_payroll_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Payroll extends BaseEntity {

    @Column(name = "month", nullable = false)
    private Integer month;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PayrollStatus status = PayrollStatus.DRAFT;

    @Column(name = "total_net", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalNet = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @OneToMany(mappedBy = "payroll", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<PayrollEntry> entries = new ArrayList<>();
}
