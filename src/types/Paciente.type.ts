import { z } from 'zod';

export enum TipoTelefono {
    CELULAR = 'CELULAR',
    FIJO = 'FIJO',
    TRABAJO = 'TRABAJO',
}

// CAMBIO: telefono.tipo usa el enum (así `defaultValues: paciente` tipa sin conversiones)
export interface IPaciente {
    direccion: {
        calle: string;
        numero: string;
        piso: string;
        departamento: string;
        barrio: string;
    };
    telefono: {
        tipo: TipoTelefono;
        codigoArea: string;
        numero: string;
    };
    // El nombre sale del catálogo de obras sociales (Configuración > Obras sociales). Por defecto "NINGUNA".
    obraSocial: {
        nombre: string;
        numeroAfiliado: string;
    };
    historialMedico: {
        fecha: string;
        diagnostico: string;
        tratamiento: string;
        medico: string;
    };
    nombre: string;
    apellido: string;
    dni: string;
    // AAAA-MM-DD. Opcional: los pacientes cargados antes de este dato (o por ingreso rápido) no lo tienen.
    fechaNacimiento?: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    id: string;
    // false = paciente desactivado (los antiguos sin el campo cuentan como activos)
    activo?: boolean;
    // Solo la recibe el ADMIN (usuario de la cuenta de acceso del paciente)
    cuenta?: { user: string } | null;
}

// NUEVO: lo que devuelve la lista (el backend no manda historialMedico ni dirección)
export type IPacienteLista = Pick<IPaciente, 'id' | 'nombre' | 'apellido' | 'dni' | 'telefono' | 'obraSocial' | 'activo'>;

// NUEVO: respuesta paginada genérica
export interface IPaginado<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const direccionSchema = z.object({
    calle: z.string(),
    numero: z.string(),
    piso: z.string().optional().default(""),
    departamento: z.string().optional().default(""),
    barrio: z.string().optional().default("")
});

// Nombre o apellido: se limpian los espacios y cada palabra queda con la primera letra en mayúscula.
// Se aceptan letras con tildes y ñ, apóstrofes y guiones ("O'Brien", "Pérez-Gómez").
const nombrePropio = (obligatorio: string, invalido: string) =>
  z
    .string()
    .transform((v) => v.trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(2, obligatorio)
        .max(40, 'Máximo 40 caracteres')
        .regex(/^\p{L}[\p{L}'’ -]*$/u, invalido),
    )
    .transform((v) => v.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, letra: string) => sep + letra.toUpperCase()));

export const ingresoSchema = z.object({
  nombre: nombrePropio('Escribí tu nombre', 'El nombre solo puede tener letras'),
  apellido: nombrePropio('Escribí tu apellido', 'El apellido solo puede tener letras'),
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI tiene 7 u 8 números, sin puntos'),
  telefono: z
    .string()
    .transform((v) => v.replace(/\D/g, '').replace(/^(0|549|54)/, ''))
    .pipe(z.string().regex(/^\d{10}$/, 'Escribí el código de área y el número (10 números en total). Ejemplo: 3794907810')),
});

// Obra social: tiene que ser una del catálogo (el servidor lo comprueba; el formulario solo deja elegir las cargadas)
export const obraSocialSchema = z.object({
    nombre: z.string().trim().toUpperCase().min(1, 'Elegí una obra social'),
    numeroAfiliado: z.string().optional().default(""),
});

const aDia = (fecha: Date) => fecha.toISOString().slice(0, 10);
const hoyAR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
// Un día de calendario que existe de verdad (rechaza 31/02)
const esDiaReal = (dia: string) => {
    const fecha = new Date(`${dia}T00:00:00Z`);
    return !Number.isNaN(fecha.getTime()) && aDia(fecha) === dia;
};

// Fecha de nacimiento: que exista, que no sea futura y de no más de 120 años atrás.
// Es obligatoria en el formulario; los pacientes viejos la completan al editarlos.
export const fechaNacimientoSchema = z
    .string({ error: 'Elegí la fecha de nacimiento' })
    .min(1, 'Elegí la fecha de nacimiento')
    .refine(esDiaReal, 'La fecha de nacimiento no es válida')
    .refine((dia) => dia <= hoyAR(), 'La fecha de nacimiento no puede ser futura')
    .refine((dia) => Number(dia.slice(0, 4)) >= Number(hoyAR().slice(0, 4)) - 120, 'La fecha de nacimiento es demasiado antigua');

// CAMBIO: se quitó historialMedico. Ese dato vive en el módulo de historia clínica
// (y con z.date() requerido el formulario nunca podía validar sin ese campo).
export const crearPacienteSchema = z.object({
    nombre: z.string().min(2, "el nombre es obligatorio"),
    apellido: z.string().trim().min(2, "el apellido es obligatorio"),
    dni: z.string().min(7, "DNI invalido"),
    fechaNacimiento: fechaNacimientoSchema,
    direccion: direccionSchema,
    email: z.email('Email invalido'),
    telefono: z.object({
        tipo: z.enum(TipoTelefono).optional().default(TipoTelefono.CELULAR),
        // Mismas reglas que el modelo del backend, así el error sale en el campo y no al guardar
        codigoArea: z.string().regex(/^\d{2,5}$/, 'Código de área: de 2 a 5 números, sin 0'),
        numero: z.string().regex(/^\d{6,10}$/, 'Número: de 6 a 10 números, sin espacios ni guiones. Ej.: código 3777 y número 500032'),
    }),
    obraSocial: obraSocialSchema,
    // Cuenta de acceso (los inputs vacíos llegan como '', por eso se permite '')
    user: z.string().trim().refine((v) => v === '' || v.length >= 3, 'Mínimo 3 caracteres').optional(),
    password: z.string().refine((v) => v === '' || v.length >= 8, 'Mínimo 8 caracteres').optional(),
});

export interface IMedicoDisponible { id: string; nombre: string; proximoTurno?: string }
export interface IMedicoResumen { id: string; nombre: string; especialidad: string }
export interface ITurnoDetalle { id: string; fecha: string; estado: string; medico: string; especialidad: string }
export type Disponibilidad = Record<string, string[]>;
export type IIngresoDTO = z.infer<typeof ingresoSchema>;
export type ICrearPacienteDTO = z.input<typeof crearPacienteSchema>;