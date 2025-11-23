package com.mrl.cockpit.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.mrl.cockpit.dto.MRLRecord;
import com.mrl.cockpit.dto.MRLXmlData;
import com.mrl.cockpit.dto.MRLXmlRecord;
import com.mrl.cockpit.dto.ValidationResult;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class XmlValidationService {

    public ValidationResult validateAndParseXml(MultipartFile file) {

        // 1) Check if file is present
        if (file == null || file.isEmpty()) {
            return ValidationResult.builder()
                    .valid(false)
                    .totalRecords(0)
                    .validRecordsCount(0)
                    .invalidRecordsCount(0)
                    .errors(List.of("No file uploaded or file is empty."))
                    .validRecords(Collections.emptyList())
                    .build();
        }

        // 2) Check extension (.xml)
        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".xml")) {
            return ValidationResult.builder()
                    .valid(false)
                    .totalRecords(0)
                    .validRecordsCount(0)
                    .invalidRecordsCount(0)
                    .errors(List.of("Invalid file type. Please upload an XML file."))
                    .validRecords(Collections.emptyList())
                    .build();
        }

        try (InputStream is = file.getInputStream()) {

            // 3) Parse XML into MRLXmlData
            XmlMapper xmlMapper = new XmlMapper();
            xmlMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            MRLXmlData xmlData = xmlMapper.readValue(is, MRLXmlData.class);

            if (xmlData == null || xmlData.getRecords() == null || xmlData.getRecords().isEmpty()) {
                return ValidationResult.builder()
                        .valid(false)
                        .totalRecords(0)
                        .validRecordsCount(0)
                        .invalidRecordsCount(0)
                        .errors(List.of("XML file does not contain any <Record> entries."))
                        .validRecords(Collections.emptyList())
                        .build();
            }

            List<String> errors = new ArrayList<>();
            List<MRLRecord> validRecords = new ArrayList<>();

            int total = xmlData.getRecords().size();

            // 4) Convert each XML record to MRLRecord
            for (int i = 0; i < xmlData.getRecords().size(); i++) {
                MRLXmlRecord xmlRecord = xmlData.getRecords().get(i);
                int recordIndex = i + 1; // for user-friendly error messages

                // Basic non-null checks (we'll expand later)
                if (isBlank(xmlRecord.getMaterialId()) ||
                        isBlank(xmlRecord.getPlant()) ||
                        isBlank(xmlRecord.getMrlNumber())) {

                    errors.add("Record " + recordIndex + ": MaterialId, Plant, and MRLNumber are required.");
                    continue;
                }

                LocalDate validFrom = null;
                LocalDate validTo = null;

                try {
                    if (!isBlank(xmlRecord.getValidFrom())) {
                        validFrom = LocalDate.parse(xmlRecord.getValidFrom());
                    }
                    if (!isBlank(xmlRecord.getValidTo())) {
                        validTo = LocalDate.parse(xmlRecord.getValidTo());
                    }
                } catch (DateTimeParseException e) {
                    errors.add("Record " + recordIndex + ": Invalid date format (expected yyyy-MM-dd).");
                    continue;
                }

                MRLRecord record = MRLRecord.builder()
                        .materialId(xmlRecord.getMaterialId())
                        .plant(xmlRecord.getPlant())
                        .mrlNumber(xmlRecord.getMrlNumber())
                        .validFrom(validFrom)
                        .validTo(validTo)
                        .status(xmlRecord.getStatus())
                        .build();

                validRecords.add(record);
            }

            int validCount = validRecords.size();
            int invalidCount = total - validCount;

            boolean overallValid = errors.isEmpty() && validCount > 0;

            return ValidationResult.builder()
                    .valid(overallValid)
                    .totalRecords(total)
                    .validRecordsCount(validCount)
                    .invalidRecordsCount(invalidCount)
                    .errors(errors)
                    .validRecords(validRecords)
                    .build();

        } catch (IOException e) {
            return ValidationResult.builder()
                    .valid(false)
                    .totalRecords(0)
                    .validRecordsCount(0)
                    .invalidRecordsCount(0)
                    .errors(List.of("Failed to read XML file: " + e.getMessage()))
                    .validRecords(Collections.emptyList())
                    .build();
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
