

CREATE TABLE IF NOT EXISTS leads (
    ilead           bigint       NOT NULL,

    nombre          varchar(100) NULL,
    empresa         varchar(100) NULL,
    cargo           varchar(50)  NULL,
    telefono        varchar(50)  NULL,
    ciudad          varchar(50)  NULL,
    origen          varchar(50)  NULL,
    iestado         smallint     NULL,
    observaciones   text         NULL,
    bactivo         boolean      NULL,

    iusuariocre     varchar(30)  NULL,
    iappcre         varchar(20)  NULL,
    iequipocre      int          NULL,
    ipcre           varchar(20)  NULL,
    fhcre           timestamptz  NULL,

    iusuarioult     varchar(30)  NULL,
    iappult         varchar(20)  NULL,
    iequipoult      int          NULL,
    ipult           varchar(20)  NULL,
    fhult           timestamptz  NULL,

    CONSTRAINT pk_leads PRIMARY KEY (ilead)
);
