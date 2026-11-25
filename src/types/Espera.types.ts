export interface IPersonaEspera {
    id: string;
    nombre: string;
    apellido: string;
}

export interface IEsperaPaciente extends IPersonaEspera {
    dni?: string;
    telefono?: { codigoArea?: string; numero?: string };
}

export interface IEspera {
    id: string;
    paciente: IEsperaPaciente;
    medico: IPersonaEspera;
    especialidad: { id: string; nombre?: string };
    nota?: string;
    estado: 'ACTIVA' | 'CUBIERTA' | 'CANCELADA';
    desde: string; // ISO: cuándo se anotó
}

// Un horario que quedó libre por una cancelación, con la fila de gente esperando a ese médico
export interface IHueco {
    clave: string;
    fechaTurno: string; // ISO: inicio del horario
    medico: IPersonaEspera;
    especialidad: { id: string; nombre?: string };
    consultorio: { id: string; nombre?: string };
    candidatos: IEspera[];
}