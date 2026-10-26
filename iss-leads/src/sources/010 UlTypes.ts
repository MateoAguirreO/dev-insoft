import { iInfoCatalogoGen } from "@ingenieria_insoft/ispazureutils";

/** Sub-recursos que puede expandir el `sqlDetalle` del lead. */
export type iInfoLead = iInfoCatalogoGen & {
	correos?: iInfoCatalogoGen;
	mensajes?: iInfoCatalogoGen;
};
