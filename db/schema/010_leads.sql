

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

    CONSTRAINT pk_leads PRIMARY KEY (ilead)
);
