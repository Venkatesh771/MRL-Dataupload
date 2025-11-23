package com.mrl.cockpit.controller;

import com.mrl.cockpit.dto.SubmitResult;
import com.mrl.cockpit.dto.ValidationResult;
import com.mrl.cockpit.service.ExcelAppendService;
import com.mrl.cockpit.service.ImportSessionService;
import com.mrl.cockpit.service.XmlValidationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ImportController {

    private final XmlValidationService xmlValidationService;
    private final ImportSessionService importSessionService;
    private final ExcelAppendService excelAppendService;

    public ImportController(XmlValidationService xmlValidationService,
                            ImportSessionService importSessionService,
                            ExcelAppendService excelAppendService) {
        this.xmlValidationService = xmlValidationService;
        this.importSessionService = importSessionService;
        this.excelAppendService = excelAppendService;
    }

    @PostMapping("/import")
    public ResponseEntity<ValidationResult> importXml(@RequestParam("file") MultipartFile file) {

        ValidationResult result = xmlValidationService.validateAndParseXml(file);

        // Store only if there are valid records
        if (result.getValidRecords() != null && !result.getValidRecords().isEmpty()) {
            importSessionService.storeValidRecords(result.getValidRecords());
        } else {
            importSessionService.clear();
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/submit")
    public ResponseEntity<SubmitResult> submitData() {

        if (!importSessionService.hasValidRecords()) {
            SubmitResult response = SubmitResult.builder()
                    .success(false)
                    .message("No valid imported data found. Please import a valid XML file first.")
                    .appendedRows(0)
                    .build();
            return ResponseEntity.badRequest().body(response);
        }

        try {
            int appended = excelAppendService.appendRecords(importSessionService.getLastImportedValidRecords());

            // Clear after successful append (so we don’t re-append by mistake)
            importSessionService.clear();

            SubmitResult response = SubmitResult.builder()
                    .success(true)
                    .message("Successfully appended " + appended + " record(s) to the Excel file.")
                    .appendedRows(appended)
                    .build();

            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            // e.g., Excel file not found
            SubmitResult response = SubmitResult.builder()
                    .success(false)
                    .message("Failed to append data: " + e.getMessage())
                    .appendedRows(0)
                    .build();
            return ResponseEntity.internalServerError().body(response);

        } catch (IOException e) {
            SubmitResult response = SubmitResult.builder()
                    .success(false)
                    .message("IO error while appending data to Excel: " + e.getMessage())
                    .appendedRows(0)
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
