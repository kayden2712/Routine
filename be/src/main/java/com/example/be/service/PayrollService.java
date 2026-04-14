package com.example.be.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.PayrollEntryRequest;
import com.example.be.dto.request.PayrollGenerateRequest;
import com.example.be.dto.response.PayrollApproveResponse;
import com.example.be.dto.response.PayrollEmployeeResponse;
import com.example.be.dto.response.PayrollEmployeesResponse;
import com.example.be.dto.response.PayrollEntryResponse;
import com.example.be.dto.response.PayrollGenerateResponse;
import com.example.be.dto.response.PayrollResponse;
import com.example.be.entity.EmployeeType;
import com.example.be.entity.Payroll;
import com.example.be.entity.PayrollEntry;
import com.example.be.entity.User;
import com.example.be.entity.enums.PayrollStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ErrorCode;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.PayrollRepository;
import com.example.be.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private static final BigDecimal THOUSAND = BigDecimal.valueOf(1000L);
    private static final BigDecimal DEFAULT_HOURLY_SALARY = BigDecimal.valueOf(1000L);

    private final PayrollRepository payrollRepository;
    private final UserRepository userRepository;

    public PayrollEmployeesResponse getActiveEmployees(Integer month, Integer year, String status) {
        if (month != null && (month < 1 || month > 12)) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "month phải từ 1 đến 12");
        }
        if (year != null && year < 2000) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "year không hợp lệ");
        }

        String normalizedStatus = status == null ? "active" : status.trim().toLowerCase(Locale.ROOT);
        List<User> users = "active".equals(normalizedStatus)
            ? userRepository.findByIsActiveTrue()
            : userRepository.findByIsActiveTrue();

        List<PayrollEmployeeResponse> employees = users.stream()
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .map(user -> PayrollEmployeeResponse.builder()
                        .id(user.getId())
                        .name(user.getFullName())
                        .type(toApiType(resolveType(user.getEmployeeType())))
                    .baseSalary(resolveHourlySalary(user).longValue())
                        .dept(user.getBranch())
                        .status("ACTIVE")
                        .build())
                .sorted(Comparator
                        .comparing(PayrollEmployeeResponse::getType)
                        .thenComparing(PayrollEmployeeResponse::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return PayrollEmployeesResponse.builder().employees(employees).build();
    }

    public List<PayrollResponse> getPayrolls(Integer month, Integer year) {
        List<Payroll> payrolls = (month != null && year != null)
                ? payrollRepository.findByMonthAndYearOrderByCreatedAtDesc(month, year)
                : payrollRepository.findTop20ByOrderByCreatedAtDesc();

        return payrolls.stream().map(this::toResponse).toList();
    }

    public PayrollResponse getPayrollById(Long payrollId) {
        Payroll payroll = payrollRepository.findWithEntriesById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảng lương id=" + payrollId));
        return toResponse(payroll);
    }

    @Transactional
    public PayrollGenerateResponse generatePayroll(PayrollGenerateRequest request) {
        validateMonthYear(request.getMonth(), request.getYear());

        Payroll existing = payrollRepository.findByMonthAndYear(request.getMonth(), request.getYear()).orElse(null);
        if (existing != null && existing.getStatus() == PayrollStatus.APPROVED) {
            throw new BadRequestException(
                    ErrorCode.BAD_REQUEST,
                    "Bảng lương tháng " + request.getMonth() + "/" + request.getYear()
                            + " đã phê duyệt, không thể chỉnh sửa.");
        }
        if (existing != null && !Boolean.TRUE.equals(request.getOverwrite())) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST,
                    "Bảng lương tháng " + request.getMonth() + "/" + request.getYear()
                            + " đã tồn tại. Vui lòng chọn ghi đè hoặc xem bảng cũ.");
        }

        Payroll payroll = existing != null ? existing : new Payroll();
        payroll.setMonth(request.getMonth());
        payroll.setYear(request.getYear());
        payroll.setStatus(PayrollStatus.DRAFT);
        payroll.setApprovedAt(null);
        payroll.setApprovedBy(null);

        if (payroll.getEntries() == null) {
            payroll.setEntries(new ArrayList<>());
        } else {
            payroll.getEntries().clear();
        }

        Map<Long, User> activeUsers = userRepository.findByIsActiveTrue().stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        if (request.getEntries() == null || request.getEntries().isEmpty()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Danh sách entries không được để trống");
        }

        Set<Long> inputIds = request.getEntries().stream()
                .map(PayrollEntryRequest::getEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (inputIds.size() != request.getEntries().size()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "employee_id bị trùng trong entries");
        }

        BigDecimal totalNet = BigDecimal.ZERO;
        List<String> errors = new ArrayList<>();

        for (PayrollEntryRequest entryRequest : request.getEntries()) {
            User employee = activeUsers.get(entryRequest.getEmployeeId());
            if (employee == null) {
                continue;
            }

            EmployeeType employeeType = parseType(entryRequest.getType());
            if (employeeType != resolveType(employee.getEmployeeType())) {
                errors.add("Nhân viên " + employee.getFullName() + " có loại không khớp hồ sơ");
                continue;
            }

            PayrollEntry entry = buildEntry(payroll, employee, employeeType, entryRequest, errors);
            if (entry == null) {
                continue;
            }

            payroll.getEntries().add(entry);
            totalNet = totalNet.add(entry.getNetSalary());
        }

        if (!errors.isEmpty()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, String.join("; ", errors));
        }

        payroll.setTotalNet(totalNet);
        Payroll saved = payrollRepository.save(payroll);

        return PayrollGenerateResponse.builder()
                .payrollId(saved.getId())
                .status(saved.getStatus().name().toLowerCase(Locale.ROOT))
                .totalNet(saved.getTotalNet().longValue())
                .build();
    }

    @Transactional
    public PayrollGenerateResponse updatePayroll(Long payrollId, PayrollGenerateRequest request) {
        Long safePayrollId = Objects.requireNonNull(payrollId);
        Payroll payroll = payrollRepository.findWithEntriesById(safePayrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảng lương id=" + payrollId));
        assertPayrollEditable(payroll);

        if (request.getEntries() == null || request.getEntries().isEmpty()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Danh sách entries không được để trống");
        }

        Set<Long> inputIds = request.getEntries().stream()
                .map(PayrollEntryRequest::getEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (inputIds.size() != request.getEntries().size()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "employee_id bị trùng trong entries");
        }

        Map<Long, User> usersById = userRepository.findAllById(inputIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        if (payroll.getEntries() == null) {
            payroll.setEntries(new ArrayList<>());
        }

        Map<Long, PayrollEntry> existingByEmployeeId = payroll.getEntries().stream()
                .filter(entry -> entry.getEmployee() != null)
                .collect(Collectors.toMap(entry -> entry.getEmployee().getId(), entry -> entry, (a, b) -> a));

        List<String> errors = new ArrayList<>();

        for (PayrollEntryRequest entryRequest : request.getEntries()) {
            User employee = usersById.get(entryRequest.getEmployeeId());
            if (employee == null) {
                continue;
            }

            EmployeeType employeeType = parseType(entryRequest.getType());
            if (employeeType != resolveType(employee.getEmployeeType())) {
                errors.add("Nhân viên " + employee.getFullName() + " có loại không khớp hồ sơ");
                continue;
            }

            PayrollEntry entry = existingByEmployeeId.get(entryRequest.getEmployeeId());
            if (entry == null) {
                entry = new PayrollEntry();
                payroll.getEntries().add(entry);
            }

            PayrollEntry computed = buildEntry(payroll, employee, employeeType, entryRequest, errors);
            if (computed == null) {
                continue;
            }

            entry.setPayroll(payroll);
            entry.setEmployee(employee);
            entry.setEmployeeType(employeeType);
            entry.setBaseSalary(computed.getBaseSalary());
            entry.setHoursWorked(computed.getHoursWorked());
            entry.setHourlyRate(computed.getHourlyRate());
            entry.setGrossSalary(computed.getGrossSalary());
            entry.setBonusAmount(computed.getBonusAmount());
            entry.setPenaltyAmount(computed.getPenaltyAmount());
            entry.setNetSalary(computed.getNetSalary());
        }

        if (!errors.isEmpty()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, String.join("; ", errors));
        }

        BigDecimal totalNet = payroll.getEntries().stream()
                .map(PayrollEntry::getNetSalary)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        payroll.setStatus(PayrollStatus.DRAFT);
        payroll.setApprovedAt(null);
        payroll.setApprovedBy(null);
        payroll.setTotalNet(totalNet);

        Payroll saved = payrollRepository.save(payroll);
        return PayrollGenerateResponse.builder()
                .payrollId(saved.getId())
                .status(saved.getStatus().name().toLowerCase(Locale.ROOT))
                .totalNet(saved.getTotalNet().longValue())
                .build();
    }

    @Transactional
    public PayrollApproveResponse approvePayroll(Long payrollId, String approverEmail) {
        Long safePayrollId = Objects.requireNonNull(payrollId);
        Payroll payroll = payrollRepository.findById(safePayrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảng lương id=" + payrollId));

        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người phê duyệt"));

        payroll.setStatus(PayrollStatus.APPROVED);
        payroll.setApprovedBy(approver);
        payroll.setApprovedAt(LocalDateTime.now());
        payrollRepository.save(payroll);

        return PayrollApproveResponse.builder().status("approved").build();
    }

    private PayrollEntry buildEntry(
            Payroll payroll,
            User employee,
            EmployeeType employeeType,
            PayrollEntryRequest request,
            List<String> errors) {
        long bonusK = sanitizeNonNegative(request.getBonus());
        long penaltyK = sanitizeNonNegative(request.getPenalty());

        BigDecimal bonusAmount = BigDecimal.valueOf(bonusK).multiply(THOUSAND);
        BigDecimal penaltyAmount = BigDecimal.valueOf(penaltyK).multiply(THOUSAND);
        BigDecimal hourlyRate = resolveHourlySalary(employee);

        Integer hours = request.getHoursWorked();
        if (hours == null || hours < 1 || hours > 744) {
            errors.add("Nhân viên " + employee.getFullName() + " phải có số giờ công từ 1-744");
            return null;
        }

        PayrollEntry entry = new PayrollEntry();
        entry.setPayroll(payroll);
        entry.setEmployee(employee);
        entry.setEmployeeType(employeeType);

        BigDecimal gross = hourlyRate.multiply(BigDecimal.valueOf(hours.longValue()));
        entry.setBaseSalary(hourlyRate);
        entry.setHoursWorked(hours);
        entry.setHourlyRate(hourlyRate);
        entry.setGrossSalary(gross);
        entry.setBonusAmount(bonusAmount);
        entry.setPenaltyAmount(penaltyAmount);
        entry.setNetSalary(gross.add(bonusAmount).subtract(penaltyAmount));

        return entry;
    }

    private PayrollResponse toResponse(Payroll payroll) {
        List<PayrollEntryResponse> entryResponses = payroll.getEntries() == null
                ? List.of()
                : payroll.getEntries().stream()
                        .map(entry -> PayrollEntryResponse.builder()
                                .employeeId(entry.getEmployee() != null ? entry.getEmployee().getId() : null)
                                .employeeName(entry.getEmployee() != null ? entry.getEmployee().getFullName() : null)
                                .type(toApiType(entry.getEmployeeType()))
                                .baseSalary(entry.getBaseSalary() != null ? entry.getBaseSalary().longValue() : null)
                                .hoursWorked(entry.getHoursWorked())
                                .hourlyRate(entry.getHourlyRate() != null ? entry.getHourlyRate().longValue() : null)
                                .grossSalary(entry.getGrossSalary() != null ? entry.getGrossSalary().longValue() : 0L)
                                .bonus(entry.getBonusAmount() != null
                                        ? entry.getBonusAmount().divide(THOUSAND).longValue()
                                        : 0L)
                                .penalty(entry.getPenaltyAmount() != null
                                        ? entry.getPenaltyAmount().divide(THOUSAND).longValue()
                                        : 0L)
                                .netSalary(entry.getNetSalary() != null ? entry.getNetSalary().longValue() : 0L)
                                .build())
                        .toList();

        return PayrollResponse.builder()
                .payrollId(payroll.getId())
                .month(payroll.getMonth())
                .year(payroll.getYear())
                .status(payroll.getStatus().name().toLowerCase(Locale.ROOT))
                .totalNet(payroll.getTotalNet() != null ? payroll.getTotalNet().longValue() : 0L)
                .entries(entryResponses)
                .build();
    }

    private void validateMonthYear(Integer month, Integer year) {
        if (month == null || month < 1 || month > 12) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Tháng là bắt buộc và phải từ 1-12");
        }
        if (year == null || year < 2000) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Năm không hợp lệ");
        }
    }

    private void assertPayrollEditable(Payroll payroll) {
        if (payroll.getStatus() == PayrollStatus.APPROVED) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Bảng lương đã phê duyệt, không thể chỉnh sửa.");
        }
    }

    private long sanitizeNonNegative(Long value) {
        if (value == null) {
            return 0L;
        }
        if (value < 0L) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Thưởng / phạt không được âm");
        }
        return value;
    }

    private EmployeeType resolveType(EmployeeType type) {
        return type == null ? EmployeeType.FULLTIME : type;
    }

    private EmployeeType parseType(String type) {
        if (type == null || type.isBlank()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "type là bắt buộc");
        }

        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if ("FULLTIME".equals(normalized)) {
            return EmployeeType.FULLTIME;
        }
        if ("PARTTIME".equals(normalized)) {
            return EmployeeType.PARTTIME;
        }

        throw new BadRequestException(ErrorCode.BAD_REQUEST, "type phải là fulltime hoặc parttime");
    }

    private String toApiType(EmployeeType employeeType) {
        return employeeType == EmployeeType.PARTTIME ? "parttime" : "fulltime";
    }

    private BigDecimal resolveHourlySalary(User user) {
        if (user == null || user.getBaseSalary() == null || user.getBaseSalary().compareTo(BigDecimal.ZERO) <= 0) {
            return DEFAULT_HOURLY_SALARY;
        }
        return user.getBaseSalary();
    }
}
