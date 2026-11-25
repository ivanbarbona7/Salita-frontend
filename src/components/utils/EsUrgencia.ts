import type { ITurno } from '../../types/Turno.Types';

// Los turnos de urgencia se crean con esta observación (ver createTurno en el backend)
export const esUrgencia = (turno: Pick<ITurno, 'observaciones'>): boolean =>
    turno.observaciones?.startsWith('Ingreso por guardia') ?? false;