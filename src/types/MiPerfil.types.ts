import { z } from 'zod';
import { crearMedicoSchema } from './Medico.types';

// El médico edita solo su teléfono y su contraseña
export const perfilSchema = z.object({ telefono: crearMedicoSchema.shape.telefono });
export type IPerfilInput = z.input<typeof perfilSchema>;
export type IPerfilDTO = z.output<typeof perfilSchema>;

export const passwordSchema = z
    .object({
        passwordActual: z.string().min(1, 'Escribí tu contraseña actual'),
        passwordNueva: z.string().min(8, 'Mínimo 8 caracteres'),
        repetir: z.string().min(1, 'Repetí la contraseña nueva'),
    })
    .refine((d) => d.passwordNueva === d.repetir, { message: 'Las contraseñas no coinciden', path: ['repetir'] })
    .refine((d) => d.passwordNueva !== d.passwordActual, {
        message: 'La nueva contraseña tiene que ser distinta de la actual',
        path: ['passwordNueva'],
    });
export type IPasswordInput = z.input<typeof passwordSchema>;
export type IPasswordDTO = z.output<typeof passwordSchema>;