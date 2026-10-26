

CREATE TABLE IF NOT EXISTS leads_correos (
    ilead           bigint       NOT NULL,
    email           varchar(100) NOT NULL,
    bprincipal      boolean      NULL,

    CONSTRAINT pk_leads_correos PRIMARY KEY (ilead, email)
);
