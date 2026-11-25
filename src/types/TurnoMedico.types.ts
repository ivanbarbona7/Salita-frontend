// Agenda del médico (GET /turnos/medico): solo sus propios turnos
export interface ITurnoMedico {
    id: string;
    fechaTurno: string;
    fechaFin: string;
    estado: 'pendiente' | 'atendido' | 'cancelado' | 'no_asistio';
    observaciones?: string;
    paciente: {
        id: string;
        nombre: string;
        apellido?: string;
        dni: string;
        telefono?: { codigoArea?: string; numero: string };
        obraSocial?: { nombre?: string; numeroAfiliado?: string; otra?: string };
    };
    consultorio?: { id: string; nombre: string };
}