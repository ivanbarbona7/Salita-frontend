import { z } from 'zod';

// Lo que muestran las pantallas del paciente para pedir turno (GET /turnos/paciente/...)
export interface IEspecialidadPaciente { id: string; nombre: string; descripcion?: string }

export interface IMedicoPaciente { id: string; nombre: string; apellido: string; proximoTurno: string }
export interface IMedicosDeEspecialidad {
  especialidad: { id: string; nombre: string };
  medicos: IMedicoPaciente[];
}

export interface IDiaDisponible { fecha: string; libres: number }
export interface IDiasDeMedico {
  medico: { id: string; nombre: string; apellido: string };
  especialidad: { id: string; nombre: string };
  dias: IDiaDisponible[];
}

export interface IConsultorioPaciente {
  id: string;
  nombre: string;
  direccion: { calle: string; numero: string };
  ciudad?: string;
}
export interface IHorarioPaciente { inicio: string; hora: string; consultorio: IConsultorioPaciente }

// Mis turnos (GET /turnos/paciente): el servidor dice cuáles son próximos y cuáles se pueden cancelar
export interface IMiTurno {
  id: string;
  fechaTurno: string;
  estado: 'pendiente' | 'atendido' | 'cancelado' | 'no_asistio';
  medico: { nombre: string; apellido: string };
  especialidad: { nombre: string };
  consultorio: IConsultorioPaciente;
  observaciones?: string;
  proximo: boolean;
  puedeCancelar: boolean;
  // Reprogramar: el servidor dice si se puede y, si no, el motivo (se muestra en el botón deshabilitado)
  reprogramado: boolean;
  puedeReprogramar: boolean;
  motivoNoReprogramar: string | null;
}

// GET /turnos/paciente/:id/dias-reprogramar: días libres del mismo médico y consultorio del turno
export interface IDiasReprogramar {
  medico: string;
  consultorio: string;
  dias: IDiaDisponible[];
}

// Resumen que viaja de la pantalla de horarios a la de confirmar y a la del comprobante
export const confirmacionSchema = z.object({
  especialidad: z.object({ id: z.string(), nombre: z.string() }),
  medico: z.object({ id: z.string(), nombre: z.string(), apellido: z.string() }),
  dia: z.string(),
  horario: z.object({
    inicio: z.string(),
    hora: z.string(),
    consultorio: z.object({
      id: z.string(),
      nombre: z.string(),
      direccion: z.object({ calle: z.string(), numero: z.string() }),
      ciudad: z.string().optional(),
    }),
  }),
});
export type IConfirmacion = z.infer<typeof confirmacionSchema>;

export interface ICrearTurnoPacienteDTO {
  consultorio: string;
  especialidad: string;
  medico: string;
  fechaTurno: string;
}

export const direccionTexto = (c: IConsultorioPaciente): string =>
  `${c.direccion.calle} ${c.direccion.numero}${c.ciudad ? `, ${c.ciudad}` : ''}`;