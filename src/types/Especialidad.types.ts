import { z } from 'zod';

export const CATEGORIAS_ESPECIALIDAD = ['Clínica', 'Quirúrgica', 'Diagnóstico', 'Terapéutica'] as const;

// El id de MongoDB es un texto (antes figuraba como number, y nombre/descripcion como String con mayúscula)
export interface IEspecialidad {
    id: string;
    nombre: string;
    descripcion: string;
    categoria?: string; // el modelo del backend todavía no la guarda (ver nota)
    activo: boolean;
}

export const crearEspecialidadSchema = z.object({
    nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(100).toUpperCase(),
    // El modelo del backend exige la descripción
    descripcion: z.string().trim().min(3, 'La descripción es obligatoria').max(200, 'Máximo 200 caracteres'),
    categoria: z.enum(CATEGORIAS_ESPECIALIDAD, { error: 'Elegí una categoría' }),
    activo: z.boolean().default(true),
});

export type ICrearEspecialidadDTO = z.input<typeof crearEspecialidadSchema>;
export type ICrearEspecialidadValidado = z.output<typeof crearEspecialidadSchema>;