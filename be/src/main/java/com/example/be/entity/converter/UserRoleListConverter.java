package com.example.be.entity.converter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import com.example.be.entity.UserRole;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class UserRoleListConverter implements AttributeConverter<List<UserRole>, String> {

    private static final String SEPARATOR = ",";

    @Override
    public String convertToDatabaseColumn(List<UserRole> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        return attribute.stream()
                .filter(Objects::nonNull)
                .map(UserRole::name)
                .distinct()
                .collect(Collectors.joining(SEPARATOR));
    }

    @Override
    public List<UserRole> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(dbData.split(SEPARATOR))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(UserRole::valueOf)
                .distinct()
                .collect(Collectors.toList());
    }
}
