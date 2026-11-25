import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import {
    ArrowCounterclockwise,
    CalendarX,
    Eye,
    FileEarmarkMedical,
    PencilSquare,
    Trash,
} from 'react-bootstrap-icons';

// Botones de acción de las filas y tarjetas (Ver, Editar, Desactivar...). Cada tipo trae su color y su ícono,
// así se ven igual en todas las pantallas. Si recibe "to" es un enlace; si recibe "onClick", un botón.
//   <BotonAccion tipo="ver" onClick={() => abrir(id)} />
//   <BotonAccion tipo="editar" to={`/medicos/editar/${id}`} />
//   <BotonAccion tipo="editar" to={`/horarios/${id}`}>Editar horario</BotonAccion>
const TIPOS = {
    ver: { variante: 'info', Icono: Eye, texto: 'Ver' },
    detalle: { variante: 'info', Icono: Eye, texto: 'Detalle' },
    editar: { variante: 'success', Icono: PencilSquare, texto: 'Editar' },
    historia: { variante: 'primary', Icono: FileEarmarkMedical, texto: 'Historia clínica' },
    ausencias: { variante: 'warning', Icono: CalendarX, texto: 'Ausencias' },
    cierres: { variante: 'warning', Icono: CalendarX, texto: 'Cierres' },
    reactivar: { variante: 'success', Icono: ArrowCounterclockwise, texto: 'Reactivar' },
    desactivar: { variante: 'danger', Icono: Trash, texto: 'Desactivar' },
    eliminar: { variante: 'danger', Icono: Trash, texto: 'Eliminar' },
} as const;

export type TipoBotonAccion = keyof typeof TIPOS;

interface Props {
    tipo: TipoBotonAccion;
    to?: string;
    onClick?: () => void;
    // Cambia el texto por defecto del tipo (por ejemplo, "Editar horario")
    children?: ReactNode;
}

const BotonAccion = ({ tipo, to, onClick, children }: Props) => {
    const { variante, Icono, texto } = TIPOS[tipo];
    const clase = 'd-inline-flex align-items-center gap-1';
    const contenido = (
        <>
            <Icono size={16} /> {children ?? texto}
        </>
    );

    if (to) {
        return (
            <Link to={to} className={`btn btn-outline-${variante} btn-sm ${clase}`}>
                {contenido}
            </Link>
        );
    }

    return (
        <Button type="button" variant={`outline-${variante}`} size="sm" className={clase} onClick={onClick}>
            {contenido}
        </Button>
    );
};

export default BotonAccion;