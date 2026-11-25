import type { IEspecialidad } from "./Especialidad.types";
import type { IHorarioAtencion } from "./Horario.types";
import { z } from 'zod';
import type { IRango } from "./Rango.types";

export interface IMedico {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    // AAAA-MM-DD. Opcional: los médicos cargados antes de este dato no la tienen.
    fechaNacimiento?: string;
    especialidad: IEspecialidad;
    matricula?: string; // los médicos cargados antes de este campo no la tienen
    telefono: {
        tipo: TipoTelefono;
        codigoArea: string;
        numero: string;
    };
    email: string;
    activo: boolean;
    // Consultorios donde atiende (el backend trae solo id y nombre)
    consultorios?: { id: string; nombre: string }[];
    // Consultorio fijo del médico (uno de los de arriba); puede completarse después
    consultorioHabitual?: { id: string; nombre: string } | null;
    horarioAtencion?: IHorarioAtencion;
    // Fechas en las que no atiende (vacaciones, viajes, un día suelto)
    ausencias?: IRango[];
    // Solo la recibe el ADMIN (usuario de la cuenta de acceso del médico)
    cuenta?: { user: string } | null;
}

export enum TipoTelefono {
    CELULAR = 'CELULAR',
    FIJO = 'FIJO',
    TRABAJO = 'TRABAJO',
}

const EDAD_MINIMA = 18;
const aDia = (fecha: Date) => fecha.toISOString().slice(0, 10);
const hoyAR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
// Un día de calendario que existe de verdad (rechaza 31/02)
const esDiaReal = (dia: string) => {
    const fecha = new Date(`${dia}T00:00:00Z`);
    return !Number.isNaN(fecha.getTime()) && aDia(fecha) === dia;
};
// Día más reciente en que se puede haber nacido para tener hoy ya 18 años cumplidos
export const nacimientoMasRecienteMedico = () => {
    const hoy = hoyAR();
    return `${Number(hoy.slice(0, 4)) - EDAD_MINIMA}${hoy.slice(4)}`;
};

// El médico tiene que ser mayor de edad. Es obligatoria: los médicos viejos la completan al editarlos.
export const fechaNacimientoMedicoSchema = z
    .string({ error: 'Elegí la fecha de nacimiento' })
    .min(1, 'Elegí la fecha de nacimiento')
    .refine(esDiaReal, 'La fecha de nacimiento no es válida')
    .refine((dia) => dia <= nacimientoMasRecienteMedico(), `El médico tiene que ser mayor de ${EDAD_MINIMA} años`)
    .refine((dia) => Number(dia.slice(0, 4)) >= Number(hoyAR().slice(0, 4)) - 100, 'La fecha de nacimiento es demasiado antigua');

export const crearMedicoSchema = z.object({
    nombre: z.string().min(2, "el nombre es obligatorio"),
    apellido: z.string().min(2, "el apellido es obligatorio"),
    dni: z.string().regex(/^\d{7,8}$/, "El DNI tiene 7 u 8 números, sin puntos"),
    fechaNacimiento: fechaNacimientoMedicoSchema,
    especialidad: z.string({ error: "El ID de la especialidad es obligatorio" }).min(1, "La especialidad es obligatoria"),
    // Consultorio habitual (opcional: se puede completar después de crear al médico) y otros consultorios donde
    // puede atender. Al enviar se juntan en una sola lista; sin consultorio el médico no recibe turnos.
    consultorioHabitual: z.string().default(''),
    consultorios: z.array(z.string()).default([]),
    matricula: z.string().trim().min(5, "La matrícula es obligatoria (mínimo 5 caracteres)"),
    telefono: z.object({
        tipo: z.enum(TipoTelefono).optional().default(TipoTelefono.CELULAR),
        codigoArea: z.string().regex(/^\d{2,5}$/, "Código de área: de 2 a 5 números"),
        numero: z.string().regex(/^\d{6,8}$/, "Número: de 6 a 8 números"),
    }),
    email: z.email('Email invalido'),
    activo: z.boolean().optional().default(true),
    // Los inputs vacíos llegan como '': se aceptan acá y se exige su contenido en medicoFormSchema (solo al crear)
    acceso: z.object({
        user: z.string().trim().refine((v) => v === '' || v.length >= 3, "Mínimo 3 caracteres"),
        password: z.string().refine((v) => v === '' || v.length >= 8, "Mínimo 8 caracteres"),
    }).optional(),
});

// Al crear, el acceso es obligatorio. Al editar puede quedar vacío (= no se cambia).
export const medicoFormSchema = (esEdicion: boolean) =>
    crearMedicoSchema.superRefine((datos, ctx) => {
        if (esEdicion) return;
        if (!datos.acceso?.user) {
            ctx.addIssue({ code: 'custom', message: 'Ingresá el usuario de acceso', path: ['acceso', 'user'] });
        }
        if (!datos.acceso?.password) {
            ctx.addIssue({ code: 'custom', message: 'Ingresá la contraseña', path: ['acceso', 'password'] });
        }
    });

export type ICrearMedicoInput = z.input<typeof crearMedicoSchema>;  // lo que maneja el formulario
export type ICrearMedicoDTO = z.output<typeof crearMedicoSchema>;   // lo que sale validado