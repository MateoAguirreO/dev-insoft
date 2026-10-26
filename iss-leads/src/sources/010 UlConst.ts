/** Tablas del proyecto en PostgreSQL (ver doc/030-Modelado-de-datos). */
export enum tablas {
  ntblLeads = "leads",
  ntblLeadsCorreos = "leads_correos",
  ntblLeadsMensajes = "leads_mensajes",
  ntblSegUsuarios = "seg_usuarios",
  ntblSegSesiones = "seg_sesiones",
}

/** Secuencias con las que el controlador asigna las llaves de leads, mensajes y sesiones */
export enum secuencias {
  seqLeads = "seq_leads",
  seqLeadsMensajes = "seq_leads_mensajes",
  seqSegSesiones = "seq_seg_sesiones",
}

/** Estado del lead; `none` es el valor que deja el conversor cuando llega un estado que no existe. */
export enum TEstadoLead {
  none = 0,
  Nuevo = 1,
  Contactado = 2,
  Calificado = 3,
  Descartado = 4,
  Convertido = 5,
}
