package com.mrl.cockpit.service;

import com.mrl.cockpit.dto.MRLRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelAppendService {

    private final String excelFilePath;
    private static final String SHEET_NAME = "MRL_DATA";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public ExcelAppendService(@Value("${mrl.excel.path}") String excelFilePath) {
        this.excelFilePath = excelFilePath;
    }

    public int appendRecords(List<MRLRecord> records) throws IOException {

        if (records == null || records.isEmpty()) {
            return 0;
        }

        File file = new File(excelFilePath);
        if (!file.exists()) {
            throw new IllegalStateException("Excel file not found at path: " + excelFilePath);
        }

        // 1) Open existing workbook
        try (FileInputStream fis = new FileInputStream(file);
             Workbook workbook = new XSSFWorkbook(fis)) {

            Sheet sheet = workbook.getSheet(SHEET_NAME);
            if (sheet == null) {
                // If sheet doesn't exist, create it and add header row
                sheet = workbook.createSheet(SHEET_NAME);
                createHeaderRow(sheet);
            }

            int lastRowNum = sheet.getLastRowNum();
            // If sheet is newly created and only has header, lastRowNum might be 0
            // We'll always append after the last row.

            for (MRLRecord record : records) {
                Row row = sheet.createRow(++lastRowNum);
                fillRowWithRecord(row, record);
            }

            // 2) Save workbook back to file
            try (FileOutputStream fos = new FileOutputStream(file)) {
                workbook.write(fos);
            }

            return records.size();
        }
    }

    private void createHeaderRow(Sheet sheet) {
        Row header = sheet.createRow(0);

        header.createCell(0, CellType.STRING).setCellValue("MaterialId");
        header.createCell(1, CellType.STRING).setCellValue("Plant");
        header.createCell(2, CellType.STRING).setCellValue("MRLNumber");
        header.createCell(3, CellType.STRING).setCellValue("ValidFrom");
        header.createCell(4, CellType.STRING).setCellValue("ValidTo");
        header.createCell(5, CellType.STRING).setCellValue("Status");
    }

    private void fillRowWithRecord(Row row, MRLRecord record) {

        Cell c0 = row.createCell(0, CellType.STRING);
        c0.setCellValue(record.getMaterialId());

        Cell c1 = row.createCell(1, CellType.STRING);
        c1.setCellValue(record.getPlant());

        Cell c2 = row.createCell(2, CellType.STRING);
        c2.setCellValue(record.getMrlNumber());

        Cell c3 = row.createCell(3, CellType.STRING);
        c3.setCellValue(record.getValidFrom() != null ? record.getValidFrom().format(DATE_FORMATTER) : "");

        Cell c4 = row.createCell(4, CellType.STRING);
        c4.setCellValue(record.getValidTo() != null ? record.getValidTo().format(DATE_FORMATTER) : "");

        Cell c5 = row.createCell(5, CellType.STRING);
        c5.setCellValue(record.getStatus() != null ? record.getStatus() : "");
    }
}
