package com.mrl.cockpit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationResult {

    private boolean valid;
    private int totalRecords;
    private int validRecordsCount;
    private int invalidRecordsCount;
    private List<String> errors;
    private List<MRLRecord> validRecords;
}
