import { z } from 'zod';

export type RolPersonal = 'ADMIN' | 'RECEPCIONISTA';

export const TURNOS_LABORALES = ['MAÑANA', 'TARDE', 'NOCHE', 'ROTATIVO'] as const;
export type TurnoLaboral = (typeof TURNOS_LABORALES)[number];

export const ETIQUETA_TURNO: Record<TurnoLaboral, string> = {
    'MAÑANA': 'Mañana',
    TARDE: 'Tarde',
    NOCHE: 'Noche',
    ROTATIVO: 'Rotativo',
};

export const ETIQUETA_ROL: Record<RolPersonal, string> = {
    ADMIN: 'Administrador',
    RECEPCIONISTA: 'Recepcionista',
};

// Lo que devuelve la API. La recepción recibe menos datos (sin DNI, nacimiento, ingreso ni usuario),
// por eso casi todo es opcional.
export interface IPersonal {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: RolPersonal;
    activo?: boolean;
    user?: string;
    dni?: string;
    fechaNacimiento?: string; // AAAA-MM-DD
    telefono?: { codigoArea: string; numero: string };
    fechaIngreso?: string;    // AAAA-MM-DD
    turno?: TurnoLaboral;
    createdAt?: string;
}

const EDAD_MINIMA = 18;
const aDia = (fecha: Date) => fecha.toISOString().slice(0, 10);
const hoyAR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
const esDiaReal = (dia: string) => {
    const fecha = new Date(`${dia}T00:00:00Z`);
    return !Number.isNaN(fecha.getTime()) && aDia(fecha) === dia;
};

// Día más reciente en que se puede haber nacido para tener hoy 18 años cumplidos
export const nacimientoMasRecientePersonal = () => {
    const hoy = hoyAR();
    return `${Number(hoy.slice(0, 4)) - EDAD_MINIMA}${hoy.slice(4)}`;
};

const nombrePropio = (mensaje: string) => z.string().trim().min(2, mensaje).max(40, 'Máximo 40 caracteres');

export const personalBaseSchema = z.object({
    nombre: nombrePropio('El nombre es obligatorio'),
    apellido: nombrePropio('El apellido es obligatorio'),
    dni: z.string().regex(/^\d{7,8}$/, 'DNI inválido: 7 u 8 números, sin puntos'),
    fechaNacimiento: z
        .string({ error: 'Elegí la fecha de nacimiento' })
        .min(1, 'Elegí la fecha de nacimiento')
        .refine(esDiaReal, 'La fecha de nacimiento no es válida')
        .refine((dia) => dia <= nacimientoMasRecientePersonal(), `Tiene que ser mayor de ${EDAD_MINIMA} años`)
        .refine((dia) => Number(dia.slice(0, 4)) >= Number(hoyAR().slice(0, 4)) - 100, 'La fecha de nacimiento es demasiado antigua'),
    telefono: z.object({
        codigoArea: z.string().regex(/^\d{2,5}$/, 'Código de área: de 2 a 5 números, sin 0'),
        numero: z.string().regex(/^\d{6,10}$/, 'Número: de 6 a 10 números, sin espacios ni guiones'),
    }),
    email: z.email('Formato de email inválido'),
    rol: z.enum(['RECEPCIONISTA', 'ADMIN']),
    // '' = sin turno / sin fecha de ingreso
    turno: z.union([z.enum(TURNOS_LABORALES), z.literal('')]),
    fechaIngreso: z
        .string()
        .refine((v) => v === '' || (esDiaReal(v) && v <= hoyAR()), 'La fecha de ingreso no es válida (no puede ser futura)'),
    // Los inputs vacíos llegan como '': al crear se exigen, al editar vacío = no cambiar
    user: z.string().trim().refine((v) => v === '' || v.length >= 3, 'Mínimo 3 caracteres'),
    password: z.string().refine((v) => v === '' || v.length >= 8, 'Mínimo 8 caracteres'),
});

export const personalFormSchema = (esEdicion: boolean) =>
    personalBaseSchema.superRefine((datos, ctx) => {
        if (esEdicion) return;
        if (!datos.user) ctx.addIssue({ code: 'custom', message: 'Ingresá el usuario', path: ['user'] });
        if (!datos.password) ctx.addIssue({ code: 'custom', message: 'Ingresá la contraseña', path: ['password'] });
    });

export type IPersonalForm = z.input<typeof personalBaseSchema>;