

CREATE TABLE IF NOT EXISTS leads_mensajes (
    imensaje        bigint       NOT NULL,

    ilead           bigint       NULL,
    email           varchar(100) NULL,
    asunto          varchar(255) NULL,
    cuerpo          text         NULL,
    fhenvio         timestamptz  NULL,

    CONSTRAINT pk_leads_mensajes PRIMARY KEY (imensaje)
);
