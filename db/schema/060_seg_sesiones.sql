CREATE TABLE IF NOT EXISTS seg_sesiones (
    isesion         bigint       NOT NULL,

    iusuario        varchar(30)  NULL,
    fhvence         timestamptz  NULL,

    iusuariocre     varchar(30)  NULL,
    iappcre         varchar(20)  NULL,
    iequipocre      int          NULL,
    ipcre           varchar(20)  NULL,
    fhcre           timestamptz  NULL,

    CONSTRAINT pk_seg_sesiones PRIMARY KEY (isesion)
);
