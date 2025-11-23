package com.mrl.cockpit.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import lombok.Data;

@Data
public class MRLXmlRecord {

    @JacksonXmlProperty(localName = "MaterialId")
    private String materialId;

    @JacksonXmlProperty(localName = "Plant")
    private String plant;

    @JacksonXmlProperty(localName = "MRLNumber")
    private String mrlNumber;

    @JacksonXmlProperty(localName = "ValidFrom")
    private String validFrom;   // string for now, we'll parse to LocalDate later

    @JacksonXmlProperty(localName = "ValidTo")
    private String validTo;     // string for now

    @JacksonXmlProperty(localName = "Status")
    private String status;
}
