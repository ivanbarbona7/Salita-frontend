// Fechas en las que un médico no atiende (ausencia) o un consultorio está cerrado (cierre).
// Las fechas son "AAAA-MM-DD" en hora argentina.
export interface IRango {
    id: string;
    desde: string;
    hasta: string;
    motivo?: string;
}

export const MAX_DIAS_RANGO = 15;     // máximo de días seguidos por carga
export const MAX_DIAS_ADELANTE = 365; // hasta cuántos días hacia adelante se puede cargar