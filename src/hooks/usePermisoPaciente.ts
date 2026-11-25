import { obtenerRol } from '../components/utils/sesion';

// Único lugar donde se decide quién puede hacer qué con un paciente.
export const usePermisosPaciente = () => {
    const rol = obtenerRol();

    return {
        verHistoria: rol === 'ADMIN' || rol === 'MEDICO',
        editar: rol === 'ADMIN' || rol === 'RECEPCIONISTA',
        // Desactivar y reactivar (no existe borrado definitivo desde la app)
        desactivar: rol === 'ADMIN' || rol === 'RECEPCIONISTA',
        // DNI, email, usuario y contraseña: datos de la cuenta de acceso
        editarCuenta: rol === 'ADMIN',
    };
};