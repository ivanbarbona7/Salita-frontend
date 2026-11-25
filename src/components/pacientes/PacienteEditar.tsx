import { Link, useParams } from 'react-router-dom';
import { Alert, Placeholder } from 'react-bootstrap';
import { useFetch } from '../../hooks/useFetch';
import FormularioPaciente from './FormularioPaciente';
import styles from '../utils/Formulario.module.scss';
import type { IPaciente } from '../../types/Paciente.type';

const PacienteEditar = () => {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, error } = useFetch<IPaciente>(id ? `/Pacientes/${id}` : null);

    if (isLoading) {
        return (
            <div className={styles.pagina} aria-busy="true">
                <div className={styles.contenedorFormulario}>
                    <Placeholder as="h3" animation="glow" className="text-center">
                        <Placeholder xs={6} />
                    </Placeholder>
                    {Array.from({ length: 4 }, (_, i) => (
                        <Placeholder key={i} as="div" animation="glow" className="mb-3">
                            <Placeholder xs={12} style={{ height: '7rem', borderRadius: 12 }} />
                        </Placeholder>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={styles.pagina}>
                <div className={styles.contenedorFormulario}>
                    <Alert variant="danger">No encontramos al paciente que querés editar.</Alert>
                    <Link to="/pacientes" className={`btn ${styles.botonSecundario}`}>Volver a pacientes</Link>
                </div>
            </div>
        );
    }

    // El formulario se monta recién cuando los datos ya llegaron, así defaultValues es correcto desde el primer render.
    return <FormularioPaciente paciente={data} />;
};

export default PacienteEditar;