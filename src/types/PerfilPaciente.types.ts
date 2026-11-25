import { z } from 'zod';
import { TipoTelefono } from './Paciente.type';

// Lo que el paciente puede editar de su ficha. Nombre, apellido, DNI y email los corrige recepción.
export const perfilPacienteSchema = z.object({
    telefono: z.object({
        tipo: z.enum(TipoTelefono),
        codigoArea: z.string().regex(/^\d{2,5}$/, 'Código de área: de 2 a 5 números'),
        numero: z.string().regex(/^\d{6,10}$/, 'Número: de 6 a 10 números'),
    }),
    direccion: z.object({
        calle: z.string().trim().min(1, 'La calle es obligatoria'),
        numero: z.string().trim().min(1, 'El número es obligatorio'),
        piso: z.string().trim(),
        departamento: z.string().trim(),
        barrio: z.string().trim(),
    }),
    // El nombre sale del catálogo de obras sociales; el servidor comprueba que exista
    obraSocial: z.object({
        nombre: z.string().trim().min(1, 'Elegí una obra social'),
        numeroAfiliado: z.string().trim(),
    }),
});
export type IPerfilPacienteForm = z.infer<typeof perfilPacienteSchema>;

// GET /pacientes/yo
export interface IMiPerfil extends IPerfilPacienteForm {
    nombre: string;
    apellido: string;
    dni: string;
    fechaNacimiento?: string; // AAAA-MM-DD (solo la corrige recepción)
    email: string;
}