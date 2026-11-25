// Una obra social del catálogo (Configuración > Obras sociales)
export interface IObraSocialItem {
    id: string;
    nombre: string;
    activo: boolean;
    // "NINGUNA": la crea el sistema, es la opción por defecto y no se puede modificar ni desactivar
    esSistema: boolean;
    // Cuántos pacientes la tienen. Solo lo recibe el personal (la lista del paciente no lo trae)
    enUso?: number;
}

export const OBRA_SOCIAL_POR_DEFECTO = 'NINGUNA';