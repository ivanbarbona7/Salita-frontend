import { Rol } from "../types/Rol.types";

export interface IItemMenu {
    ruta: string;
    etiqueta: string;
    roles: Rol[];
    grupo?: string;
}

const GESTION: Rol[] = ["ADMIN", "RECEPCIONISTA"];

export const MENU: IItemMenu[] = [
    { ruta: "/recepcion", etiqueta: "Inicio", roles: GESTION },
    { ruta: "/inicio", etiqueta: "Inicio", roles: ["MEDICO"] },
    { ruta: "/mis-turnos", etiqueta: "Mis turnos", roles: ["MEDICO"] },
    { ruta: "/pacientes", etiqueta: "Pacientes", roles:  [...GESTION, "MEDICO"] },
    { ruta: "/turnos", etiqueta: "Turno nuevo", roles: GESTION },
    { ruta: "/lista-espera", etiqueta: "Lista de espera", roles: GESTION },
    { ruta: "/medicos", etiqueta: "Médicos", roles: GESTION },
    { ruta: "/personal", etiqueta: "Personal", roles: GESTION },

    { ruta: "/obras-sociales", etiqueta: "Obras sociales", roles: GESTION, grupo: "Configuración" },
    { ruta: "/consultorios", etiqueta: "Consultorios", roles: GESTION, grupo: "Configuración" },
    { ruta: "/especialidades", etiqueta: "Especialidades", roles: GESTION, grupo: "Configuración" },
    { ruta: "/horarios", etiqueta: "Horario de atención", roles: GESTION, grupo: "Configuración" },
    { ruta: "/mi-horario", etiqueta: "Mi horario de atención", roles: ["MEDICO"], grupo: "Configuración" },
    { ruta: "/mis-ausencias", etiqueta: "Mis ausencias", roles: ["MEDICO"], grupo: "Configuración" },
    { ruta: "/mi-perfil", etiqueta: "Mi perfil", roles: ["MEDICO"], grupo: "Configuración" },
];