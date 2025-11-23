package com.mrl.cockpit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MRLRecord {

    private String materialId;
    private String plant;
    private String mrlNumber;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String status;
}
