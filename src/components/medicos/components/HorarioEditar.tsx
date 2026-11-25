import { Link, useParams } from 'react-router-dom';
import { Alert, Placeholder } from 'react-bootstrap';
import { useFetch } from '../../../hooks/useFetch';
import FormularioHorario from './FormularioHorario';
import styles from '../../utils/Formulario.module.scss';
import type { IMedico } from '../../../types/Medico.types';

const HorarioEditar = () => {
    const { id } = useParams<{ id: string }>();
    // Sin id en la ruta (/mi-horario) es el propio médico: sus datos salen de su cuenta
    const esPropio = id === undefined;
    const base = esPropio ? '/medicos/yo' : `/medicos/${id}`;
    const rutaVolver = esPropio ? '/inicio' : '/horarios';
    const { data: medico, isLoading, error } = useFetch<IMedico>(base);

    if (isLoading) {
        return (
            <div className={styles.pagina} aria-busy="true">
                <div className={styles.contenedorFormulario}>
                    <Placeholder animation="glow">
                        <Placeholder xs={6} size="lg" className="mb-4" />
                        <Placeholder xs={12} style={{ height: '5rem', borderRadius: 12 }} className="mb-3" />
                        <Placeholder xs={12} style={{ height: '9rem', borderRadius: 12 }} />
                    </Placeholder>
                </div>
            </div>
        );
    }

    if (error || !medico) {
        return (
            <div className={styles.pagina}>
                <div className={styles.contenedorFormulario}>
                    <Alert variant="danger">No encontramos al médico.</Alert>
                    <Link to={rutaVolver} className={`btn ${styles.botonSecundario}`}>
                        Volver
                    </Link>
                </div>
            </div>
        );
    }

    // El formulario se monta recién con los datos cargados, así defaultValues es correcto desde el primer render.
    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h3 className={styles.titulo}>Horario de atención</h3>
                <p className="text-center text-muted mb-4">
                    {medico.apellido}, {medico.nombre} · {medico.especialidad?.nombre ?? 'Sin especialidad'}
                </p>
                <FormularioHorario medico={medico} base={base} rutaVolver={rutaVolver} />
            </div>
        </div>
    );
};

export default HorarioEditar;