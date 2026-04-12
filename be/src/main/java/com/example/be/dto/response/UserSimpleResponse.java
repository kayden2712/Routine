package com.example.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simplified User Response DTO
 * Used for nested user information in other responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSimpleResponse {
    
    /**
     * User ID
     */
    private Long id;
    
    /**
     * Username
     */
    private String username;
    
    /**
     * Full name of the user
     */
    private String fullName;
}
