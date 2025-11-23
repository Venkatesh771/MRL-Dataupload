package com.mrl.cockpit.service;

import com.mrl.cockpit.dto.MRLRecord;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class ImportSessionService {

    private List<MRLRecord> lastImportedValidRecords = Collections.emptyList();

    public void storeValidRecords(List<MRLRecord> records) {
        if (records == null) {
            this.lastImportedValidRecords = Collections.emptyList();
        } else {
            this.lastImportedValidRecords = List.copyOf(records); // make it immutable copy
        }
    }

    public List<MRLRecord> getLastImportedValidRecords() {
        return lastImportedValidRecords;
    }

    public boolean hasValidRecords() {
        return lastImportedValidRecords != null && !lastImportedValidRecords.isEmpty();
    }

    public void clear() {
        this.lastImportedValidRecords = Collections.emptyList();
    }
}
