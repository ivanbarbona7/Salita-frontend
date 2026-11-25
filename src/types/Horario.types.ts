import { z } from 'zod';

// diaSemana usa la misma numeración que Date.getDay(): 0 = domingo ... 6 = sábado.
// Se muestran de lunes a domingo, como se usa en Argentina.
export const DIAS_SEMANA = [
    { valor: 1, etiqueta: 'Lunes', corto: 'Lun' },
    { valor: 2, etiqueta: 'Martes', corto: 'Mar' },
    { valor: 3, etiqueta: 'Miércoles', corto: 'Mié' },
    { valor: 4, etiqueta: 'Jueves', corto: 'Jue' },
    { valor: 5, etiqueta: 'Viernes', corto: 'Vie' },
    { valor: 6, etiqueta: 'Sábado', corto: 'Sáb' },
    { valor: 0, etiqueta: 'Domingo', corto: 'Dom' },
] as const;

export const DIAS_LABORALES: number[] = [1, 2, 3, 4, 5];

// Franja de un consultorio (su horario de atención)
export interface IFranja {
    diaSemana: number;
    desde: string; // "HH:mm"
    hasta: string; // "HH:mm"
}

// Franja del horario de un médico: además dice en qué consultorio atiende
export interface IFranjaMedico extends IFranja {
    consultorio: string; // id del consultorio
}

export interface IHorarioAtencion {
    duracionTurno: number; // minutos
    franjas: IFranjaMedico[];
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const franjaBase = z.object({
    diaSemana: z.number().int().min(0).max(6),
    desde: z.string().regex(HORA, 'Hora inválida'),
    hasta: z.string().regex(HORA, 'Hora inválida'),
});

// "HH:mm" se puede comparar como texto
const finPosteriorAlInicio = (f: { desde: string; hasta: string }) => f.desde < f.hasta;
const mensajeFin = { message: 'Debe ser posterior al inicio', path: ['hasta'] };

export const franjaSchema = franjaBase.refine(finPosteriorAlInicio, mensajeFin);

export const franjaMedicoSchema = franjaBase
    .extend({ consultorio: z.string().min(1, 'Elegí el consultorio') })
    .refine(finPosteriorAlInicio, mensajeFin);

// Dos franjas de un mismo día se superponen si cada una empieza antes de que termine la otra.
// Que una termine justo cuando empieza la otra (12:00 y 12:00) está permitido.
export const haySuperposicion = (franjas: IFranja[]) =>
    franjas.some((a, i) =>
        franjas.some((b, j) => j > i && a.diaSemana === b.diaSemana && a.desde < b.hasta && b.desde < a.hasta),
    );

export const horarioSchema = z
    .object({
        duracionTurno: z
            .number({ error: 'Ingresá la duración del turno' })
            .int('Debe ser un número entero')
            .min(5, 'Mínimo 5 minutos')
            .max(120, 'Máximo 120 minutos'),
        franjas: z.array(franjaMedicoSchema).max(28),
    })
    // También cuenta entre consultorios distintos: el médico no puede estar en dos lugares a la vez
    .refine((h) => !haySuperposicion(h.franjas), {
        message: 'Hay horarios que se superponen en un mismo día',
        path: ['franjas'],
    });

export type IHorarioForm = z.input<typeof horarioSchema>;

// Horario que otro médico ya tiene en un consultorio (GET /medicos/:id/ocupacion)
export interface IOcupacion extends IFranja {
    consultorio: string;
    medico: { id: string; nombre: string; apellido: string };
}

// Agenda de un consultorio: quién atiende cada día y a qué hora (GET /consultorios/agenda)
export interface IAgendaConsultorio {
    id: string;
    nombre: string;
    horarioConsultorio: IFranja[]; // cuándo abre el consultorio
    franjas: {
        diaSemana: number;
        desde: string;
        hasta: string;
        medico: { id: string; nombre: string; apellido: string };
    }[];
}