import { Link } from 'react-router-dom';
import { Col, Row } from 'react-bootstrap';
import { CalendarWeek } from 'react-bootstrap-icons';
import { useFetch } from '../hooks/useFetch';
import TarjetaResumen from '../components/panel/TarjetaResumen';
import ListaTurnosMedico from '../components/turnos/ListaTurnosMedico';
import styles from '../components/utils/Formulario.module.scss';
import type { ITurnoMedico } from '../types/TurnoMedico.types';

// Inicio del médico: solo sus turnos de hoy y unos contadores
const InicioMedico = () => {
    const { data, isLoading, refetch } = useFetch<ITurnoMedico[]>('/turnos/medico');
    const turnos = data ?? [];
    const pendientes = turnos.filter((t) => t.estado === 'pendiente').length;
    const atendidos = turnos.filter((t) => t.estado === 'atendido').length;

    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h1 className={styles.titulo}>Inicio</h1>
                <Row className="g-3 mb-4">
                    <Col xs={12} sm={4}><TarjetaResumen titulo="Turnos de hoy" valor={turnos.length} isLoading={isLoading} /></Col>
                    <Col xs={6} sm={4}><TarjetaResumen titulo="Pendientes" valor={pendientes} isLoading={isLoading} /></Col>
                    <Col xs={6} sm={4}><TarjetaResumen titulo="Atendidos" valor={atendidos} isLoading={isLoading} /></Col>
                </Row>

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h2 className="fs-5 mb-0">Turnos de hoy</h2>
                    <Link to="/mis-turnos" className={`btn ${styles.botonSecundario} d-inline-flex align-items-center gap-2`}>
                        <CalendarWeek size={16} aria-hidden="true" />
                        Ver turnos de otros días
                    </Link>
                </div>

                {!isLoading && <ListaTurnosMedico turnos={turnos} onCambio={refetch} />}
            </div>
        </div>
    );
};

export default InicioMedico;