import { Alert, Button, Placeholder } from 'react-bootstrap';
import { useFetch } from '../../hooks/useFetch';
import type { IDisponibilidad } from '../../types/Turno.Types';

interface Props {
    medicoId: string;
    consultorioId: string;
    fecha: string; // AAAA-MM-DD
    elegido: string | null; // "inicio" (ISO) del horario elegido
    onElegir: (inicio: string) => void;
}

// Horarios libres de un médico en un consultorio y un día. Quien lo usa le pasa un `key` con la fecha,
// así al cambiar de día se monta de nuevo y no queda la lista del día anterior.
const HorariosLibres = ({ medicoId, consultorioId, fecha, elegido, onElegir }: Props) => {
    const { data, isLoading } = useFetch<IDisponibilidad>(
        `/turnos/disponibilidad?medico=${medicoId}&consultorio=${consultorioId}&fecha=${fecha}`,
    );

    if (isLoading) {
        return (
            <Placeholder animation="glow" aria-busy="true">
                <Placeholder xs={12} style={{ height: '4rem', borderRadius: 12 }} />
            </Placeholder>
        );
    }

    const horarios = data?.horarios ?? [];
    if (horarios.length === 0) {
        return <Alert variant="warning" className="mb-0">No quedan horarios libres ese día. Probá con otro.</Alert>;
    }

    return (
        <div className="d-flex flex-wrap gap-2" role="group" aria-label="Horarios libres">
            {horarios.map((h) => (
                <Button
                    key={h.inicio}
                    variant={elegido === h.inicio ? 'primary' : 'outline-primary'}
                    onClick={() => onElegir(h.inicio)}
                    aria-pressed={elegido === h.inicio}
                >
                    {h.hora}
                </Button>
            ))}
        </div>
    );
};

export default HorariosLibres;