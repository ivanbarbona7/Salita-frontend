import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { PersonFill } from 'react-bootstrap-icons';
import type { Rol } from '../../types/Rol.types';
import { obtenerNombre } from '../utils/sesion';
import styles from './UsuarioActual.module.scss';

// Texto corto para la insignia; el nombre completo se ve al pasar el mouse
const ETIQUETA: Record<Rol, string> = {
    ADMIN: 'Admin',
    RECEPCIONISTA: 'Recepción',
    MEDICO: 'Médico',
    PACIENTE: 'Paciente',
};

const NOMBRE_COMPLETO: Record<Rol, string> = {
    ADMIN: 'Administrador',
    RECEPCIONISTA: 'Recepcionista',
    MEDICO: 'Médico',
    PACIENTE: 'Paciente',
};

const CLASE: Record<Rol, string> = {
    ADMIN: styles.admin ?? '',
    RECEPCIONISTA: styles.recepcionista ?? '',
    MEDICO: styles.medico ?? '',
    PACIENTE: styles.paciente ?? '',
};

// Insignia con el rol de la cuenta ("Administrador", "Recepcionista", "Médico")
export const InsigniaRol = ({ rol }: { rol: Rol }) => (
    <span className={`${styles.rol} ${CLASE[rol]}`} title={`Estás conectado como ${NOMBRE_COMPLETO[rol]}`}>
        <PersonFill size={13} aria-hidden="true" />
        {ETIQUETA[rol]}
    </span>
);

// Quien está conectado: solo las iniciales en un círculo. El nombre completo aparece al pasar el mouse
// (o al enfocarlo con el teclado) para que se pueda confirmar que es la cuenta propia.
// En el menú de celular, donde sobra lugar, el nombre se ve al lado.
// No muestra nada si el token todavía no trae el nombre.
export const NombreUsuario = () => {
    const nombre = obtenerNombre();
    if (!nombre) return null;

    const iniciales = nombre
        .split(' ')
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('');

    return (
        <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip id="tooltip-usuario">Estás conectado como <strong>{nombre}</strong></Tooltip>}
        >
            <span className={styles.nombre} tabIndex={0} aria-label={`Estás conectado como ${nombre}`}>
                <span className={styles.avatar} aria-hidden="true">{iniciales}</span>
                <span className={styles.textoMovil}>{nombre}</span>
            </span>
        </OverlayTrigger>
    );
};