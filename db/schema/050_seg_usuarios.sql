CREATE TABLE IF NOT EXISTS seg_usuarios (
    iusuario        varchar(30)  NOT NULL,

    nombre          varchar(100) NULL,
    clave           varchar(255) NULL,
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

    CONSTRAINT pk_seg_usuarios PRIMARY KEY (iusuario)
);
