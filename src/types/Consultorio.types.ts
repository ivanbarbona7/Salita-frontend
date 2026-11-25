import { z } from 'zod';
import type { IEspecialidad } from './Especialidad.types';
import { TipoTelefono, type IMedico } from './Medico.types';
import { franjaSchema, haySuperposicion, type IFranja } from './Horario.types';
import type { IRango } from './Rango.types';

export interface IConsultorio {
    id: string;
    nombre: string;
    especialidades: IEspecialidad[];
    // true = atiende cualquier especialidad (especialidades viene vacía)
    todasLasEspecialidades?: boolean;
    // El backend solo trae nombre y apellido del responsable
    profesionalResponsable: Pick<IMedico, 'id' | 'nombre' | 'apellido'>;
    direccion: {
        calle: string;
        numero: string;
        piso: string;
        departamento: string;
        barrio: string;
    };
    ciudad: string;
    telefono: {
        tipo: TipoTelefono;
        codigoArea: string;
        numero: string;
    };
    correoElectronico: string;
    // Horario semanal: varias franjas por día (diaSemana 0 = domingo ... 6 = sábado)
    horarioAtencion: {
        franjas: IFranja[];
    };
    activo: boolean;
    // Fechas en las que el consultorio está cerrado (feriados, obras)
    cierres?: IRango[];
    // Médicos activos que atienden acá (se arma en el backend a partir de cada médico; solo lectura)
    medicos?: { id: string; nombre: string; apellido: string }[];
}

export const direccionSchema = z.object({
    calle: z.string().trim().min(1, 'La calle es obligatoria'),
    numero: z.string().trim().min(1, 'El número es obligatorio'),
    piso: z.string().default(''),
    departamento: z.string().default(''),
    barrio: z.string().default(''),
});

export const crearConsultorioSchema = z.object({
    nombre: z.string().trim().min(2, 'El nombre es obligatorio'),
    especialidades: z.array(z.string()).default([]),
    todasLasEspecialidades: z.boolean().default(false),
    profesionalResponsable: z
        .string({ error: 'El profesional responsable es obligatorio' })
        .min(1, 'El profesional responsable es obligatorio'),
    direccion: direccionSchema,
    ciudad: z.string().trim().min(2, 'La ciudad es obligatoria'),
    telefono: z.object({
        tipo: z.enum(TipoTelefono).optional().default(TipoTelefono.CELULAR),
        codigoArea: z.string().regex(/^[0-9]{2,5}$/, 'Código de área: de 2 a 5 números'),
        numero: z.string().regex(/^[0-9]{6,8}$/, 'Número: de 6 a 8 números'),
    }),
    correoElectronico: z.email('Email inválido'),
    horarioAtencion: z
        .object({
            franjas: z.array(franjaSchema).min(1, 'Cargá al menos un horario de atención').max(28),
        })
        .refine((h) => !haySuperposicion(h.franjas), {
            message: 'Hay horarios que se superponen en un mismo día',
            path: ['franjas'],
        }),
    activo: z.boolean().optional().default(true),
}).refine((d) => d.todasLasEspecialidades || d.especialidades.length > 0, {
    message: 'Elegí al menos una especialidad o marcá "Atiende todas las especialidades"',
    path: ['especialidades'],
});

export type ICrearConsultorioInput = z.input<typeof crearConsultorioSchema>;  // formulario
export type ICrearConsultorioDTO = z.output<typeof crearConsultorioSchema>;   // salida validada