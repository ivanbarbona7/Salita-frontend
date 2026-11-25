import { DIAS_SEMANA } from '../../types/Horario.types';

export interface LineaResumen {
    dia: string;
    horas: string;
}

interface FranjaResumen {
    diaSemana: number;
    desde: string;
    hasta: string;
    consultorio?: string; // solo en el horario de un médico
}

// "Lun 08:00–12:00 (Consultorio 1) · 15:00–18:00 (Consultorio 2)": un renglón por cada día en que atiende.
// Si se pasa nombreConsultorio, cada franja muestra el nombre de su consultorio.
export const resumirHorario = (
    franjas: FranjaResumen[],
    nombreConsultorio?: (id: string) => string | undefined,
): LineaResumen[] =>
    DIAS_SEMANA.map((dia): LineaResumen | null => {
        const delDia = franjas
            .filter((f) => f.diaSemana === dia.valor)
            .sort((a, b) => a.desde.localeCompare(b.desde));
        if (delDia.length === 0) return null;

        const horas = delDia
            .map((f) => {
                const nombre = f.consultorio ? nombreConsultorio?.(f.consultorio) : undefined;
                return `${f.desde}–${f.hasta}${nombre ? ` (${nombre})` : ''}`;
            })
            .join(' · ');
        return { dia: dia.corto, horas };
    }).filter((linea): linea is LineaResumen => linea !== null);