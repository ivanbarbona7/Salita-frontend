import { useState } from 'react';
import { Form, Placeholder } from 'react-bootstrap';
import CampoFecha from '../components/utils/CampoFecha';
import { useFetch } from '../hooks/useFetch';
import ListaTurnosMedico from '../components/turnos/ListaTurnosMedico';
import styles from '../components/utils/Formulario.module.scss';
import type { ITurnoMedico } from '../types/TurnoMedico.types';

// Fecha de hoy en Argentina como AAAA-MM-DD
const hoyAR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

const TurnosDelDia = ({ fecha }: { fecha: string }) => {
    const { data, isLoading, refetch } = useFetch<ITurnoMedico[]>(`/turnos/medico?fecha=${fecha}`);
    if (isLoading) {
        return (
            <Placeholder animation="glow" aria-busy="true">
                <Placeholder xs={12} style={{ height: '8rem', borderRadius: 12 }} />
            </Placeholder>
        );
    }
    return <ListaTurnosMedico turnos={data ?? []} onCambio={refetch} />;
};

const AgendaMedico = () => {
    const [fecha, setFecha] = useState(hoyAR);
    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h1 className={styles.titulo}>Mis turnos</h1>
                <Form.Group className="mb-3" style={{ maxWidth: 240 }}>
                    <Form.Label htmlFor="fecha-agenda">Fecha</Form.Label>
                    <CampoFecha id="fecha-agenda" valor={fecha} onChange={(dia) => dia && setFecha(dia)} />
                </Form.Group>
                {/* key: al cambiar de fecha se monta de nuevo y no queda la lista del día anterior */}
                <TurnosDelDia key={fecha} fecha={fecha} />
            </div>
        </div>
    );
};

export default AgendaMedico;