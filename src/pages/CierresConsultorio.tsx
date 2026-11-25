import { Link, useParams } from 'react-router-dom';
import { Alert, Placeholder } from 'react-bootstrap';
import { useFetch } from '../hooks/useFetch';
import PanelAusencias from '../components/calendario/PanelAusencias';
import styles from '../components/utils/Formulario.module.scss';
import type { IConsultorio } from '../types/Consultorio.types';

// Solo admin: fechas en las que un consultorio está cerrado (feriados, obras). Valen para todos sus médicos.
const CierresConsultorio = () => {
    const { id } = useParams<{ id: string }>();
    const { data: consultorio, isLoading, error, refetch } = useFetch<IConsultorio>(id ? `/consultorios/${id}` : null);

    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h1 className={styles.titulo}>{consultorio ? `Cierres de ${consultorio.nombre}` : 'Cierres del consultorio'}</h1>

                {isLoading && (
                    <Placeholder animation="glow" aria-busy="true">
                        <Placeholder xs={12} style={{ height: '16rem', borderRadius: 12 }} />
                    </Placeholder>
                )}
                {!isLoading && (error || !consultorio) && (
                    <>
                        <Alert variant="danger">No se pudo cargar el consultorio.</Alert>
                        <Link to="/consultorios" className={`btn ${styles.botonSecundario}`}>Volver</Link>
                    </>
                )}
                {consultorio && (
                    <PanelAusencias
                        tipo="cierre"
                        ruta={`/consultorios/${consultorio.id}/cierres`}
                        rangos={consultorio.cierres ?? []}
                        onCambio={refetch}
                    />
                )}
            </div>
        </div>
    );
};

export default CierresConsultorio;