

CREATE TABLE IF NOT EXISTS leads_mensajes (
    imensaje        bigint       NOT NULL,

    ilead           bigint       NULL,
    email           varchar(100) NULL,
    asunto          varchar(255) NULL,
    cuerpo          text         NULL,
    fhenvio         timestamptz  NULL,

    iusuariocre     varchar(30)  NULL,
    iappcre         varchar(20)  NULL,
    iequipocre      int          NULL,
    ipcre           varchar(20)  NULL,
    fhcre           timestamptz  NULL,

    CONSTRAINT pk_leads_mensajes PRIMARY KEY (imensaje)
);
