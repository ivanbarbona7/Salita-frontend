import { z } from 'zod';

export const ACTIVIDADES_FISICAS = ['Ninguna', 'Baja', 'Moderada', 'Alta'] as const;
export type ActividadFisica = (typeof ACTIVIDADES_FISICAS)[number];

// ---------- Lo que devuelve el servidor ----------
export interface IAntecedentes {
    alergias: string[];
    enfermedadesCronicas: string[];
    medicamentosHabituales: string[];
    cirugiasPrevias: string[];
    internacionesPrevias: string[];
    antecedentesFamiliares: string[];
    vacunas: string[];
    habitos: { tabaquismo: boolean; alcohol: boolean; actividadFisica: ActividadFisica };
    otros: string;
}

export interface IConsulta {
    id: string;
    fecha: string;
    medico: { id: string; nombre: string; apellido: string; matricula?: string } | null;
    motivoConsulta: string;
    sintomas: string[];
    diagnostico: string;
    tratamiento: string;
    observaciones: string;
}

export interface IHistoriaClinica {
    id: string;
    paciente: string;
    antecedentes: IAntecedentes;
    consultas: IConsulta[];
}

export interface ITurnoParaAtender {
    id: string;
    fechaTurno: string;
}

// ---------- Listas: en los formularios se escribe un ítem por línea ----------
export const aLista = (texto: string): string[] =>
    texto
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean);

export const desdeLista = (lista: string[] | undefined): string => (lista ?? []).join('\n');

const lineas = z
    .string()
    .refine((t) => aLista(t).length <= 30, 'Máximo 30 ítems, uno por línea')
    .refine((t) => aLista(t).every((l) => l.length <= 120), 'Cada ítem puede tener hasta 120 caracteres');

// ---------- Antecedentes ----------
export const antecedentesFormSchema = z.object({
    alergias: lineas,
    enfermedadesCronicas: lineas,
    medicamentosHabituales: lineas,
    cirugiasPrevias: lineas,
    internacionesPrevias: lineas,
    antecedentesFamiliares: lineas,
    vacunas: lineas,
    tabaquismo: z.boolean(),
    alcohol: z.boolean(),
    actividadFisica: z.enum(ACTIVIDADES_FISICAS),
    otros: z.string().trim().max(500, 'Máximo 500 caracteres'),
});
export type IAntecedentesForm = z.infer<typeof antecedentesFormSchema>;

export const antecedentesAFormulario = (a?: IAntecedentes): IAntecedentesForm => ({
    alergias: desdeLista(a?.alergias),
    enfermedadesCronicas: desdeLista(a?.enfermedadesCronicas),
    medicamentosHabituales: desdeLista(a?.medicamentosHabituales),
    cirugiasPrevias: desdeLista(a?.cirugiasPrevias),
    internacionesPrevias: desdeLista(a?.internacionesPrevias),
    antecedentesFamiliares: desdeLista(a?.antecedentesFamiliares),
    vacunas: desdeLista(a?.vacunas),
    tabaquismo: a?.habitos.tabaquismo ?? false,
    alcohol: a?.habitos.alcohol ?? false,
    actividadFisica: a?.habitos.actividadFisica ?? 'Ninguna',
    otros: a?.otros ?? '',
});

export const formularioAAntecedentes = (f: IAntecedentesForm): IAntecedentes => ({
    alergias: aLista(f.alergias),
    enfermedadesCronicas: aLista(f.enfermedadesCronicas),
    medicamentosHabituales: aLista(f.medicamentosHabituales),
    cirugiasPrevias: aLista(f.cirugiasPrevias),
    internacionesPrevias: aLista(f.internacionesPrevias),
    antecedentesFamiliares: aLista(f.antecedentesFamiliares),
    vacunas: aLista(f.vacunas),
    habitos: { tabaquismo: f.tabaquismo, alcohol: f.alcohol, actividadFisica: f.actividadFisica },
    otros: f.otros.trim(),
});

// ---------- Consulta nueva ----------
export const consultaFormSchema = z.object({
    turno: z.string(), // '' = sin turno
    motivoConsulta: z.string().trim().min(1, 'Escribí el motivo de la consulta').max(500, 'Máximo 500 caracteres'),
    sintomas: lineas,
    diagnostico: z.string().trim().min(1, 'Escribí el diagnóstico').max(1000, 'Máximo 1000 caracteres'),
    tratamiento: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
    observaciones: z.string().trim().max(500, 'Máximo 500 caracteres'),
});
export type IConsultaForm = z.infer<typeof consultaFormSchema>;

export const formularioAConsulta = (f: IConsultaForm) => ({
    motivoConsulta: f.motivoConsulta.trim(),
    sintomas: aLista(f.sintomas),
    diagnostico: f.diagnostico.trim(),
    tratamiento: f.tratamiento.trim(),
    observaciones: f.observaciones.trim(),
    ...(f.turno ? { turno: f.turno } : {}),
});