import type { IPaciente } from './Paciente.type'
import type { IMedico } from './Medico.types'
import {z} from 'zod';

// CAMBIO: el turno ahora guarda el consultorio, y la especialidad llega como objeto (con su nombre)
export interface ITurno {
	paciente: IPaciente;
	// Opcionales: los turnos viejos (anteriores a este cambio) no los tienen
	consultorio?: { id: string; nombre: string };
	especialidad?: { id: string; nombre: string };
	medico: Pick<IMedico, 'id' | 'nombre' | 'apellido'>;
	fechaTurno: string; // inicio
	fechaFin: string;
	estado: 'pendiente' | 'atendido' | 'cancelado' | 'no_asistio';
	observaciones: string;
	createdAt: string;
	updatedAt: string;
	id: string;
}
export enum EstadoTurno {
    PENDIENTE = "pendiente",
    ATENDIDO = "atendido",
    CANCELADO = "cancelado",
    NO_ASISTIO = "no_asistio"
}

// El orden del formulario es: paciente, consultorio, especialidad, médico, fecha y horario.
// "fecha" (el día) solo sirve para pedir los horarios libres: no se envía al backend.
export const CrearTurnoSchema = z.object({
    paciente: z.string().min(1, "Buscá y seleccioná un paciente"),
    consultorio: z.string().min(1, "Elegí el consultorio"),
    especialidad: z.string().min(1, "Elegí la especialidad"),
    medico: z.string().min(1, "Elegí el médico"),
    // Solo para pedir los horarios libres: no se envía
    fecha: z.string().default(""),
    // Es el "inicio" de uno de los horarios libres que calcula el backend (ISO en UTC).
    // En una urgencia es la fecha y hora que se escribe a mano.
    fechaTurno: z.iso.datetime({ message: "Elegí la fecha y hora del turno" }),
    // Urgencia: se puede usar cualquier consultorio y médico de la especialidad y escribir la hora a mano
    urgencia: z.boolean().default(false),
    fechaUrgencia: z.string().default(""), // lo que se escribe en el campo de fecha y hora (no se envía)
    observaciones: z.string().max(500, "Las observaciones no pueden superar los 500 caracteres").default("")
});

export const queryUrgenciaSchema = z.object({
    query: z.object({
        urgencia: z.enum(['true', 'false']).optional()
    })
});

// Horarios libres de un médico en un consultorio y un día (GET /turnos/disponibilidad)
export interface IHorarioLibre {
	inicio: string; // ISO en UTC: se envía tal cual al crear el turno
	hora: string;   // "08:20", en hora argentina
}

export interface IDisponibilidad {
	duracionTurno: number;
	horarios: IHorarioLibre[];
}

export type ICrearTurnoDTO = z.input<typeof CrearTurnoSchema>
export type ICrearTurnoValidado = z.output<typeof CrearTurnoSchema>
export type IQueryUrgenciaSchema = z.input<typeof queryUrgenciaSchema>