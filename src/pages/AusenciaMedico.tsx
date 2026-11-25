import { Link, useParams } from 'react-router-dom';
import { Alert, Placeholder } from 'react-bootstrap';
import { useFetch } from '../hooks/useFetch';
import PanelAusencias from '../components/calendario/PanelAusencias';
import type { Marcado } from '../components/calendario/Almanaque';
import styles from '../components/utils/Formulario.module.scss';
import type { IMedico } from '../types/Medico.types';
import type { IConsultorio } from '../types/Consultorio.types';

// Sin id en la ruta (/mis-ausencias) es el propio médico. Con id (/medicos/:id/ausencias) lo usan admin y recepción.
const AusenciasMedico = () => {
    const { id } = useParams<{ id: string }>();
    const esPropio = id === undefined;
    const base = esPropio ? '/medicos/yo' : `/medicos/${id}`;

    const { data: medico, isLoading, error, refetch } = useFetch<IMedico>(base);
    const { data: consultorios } = useFetch<IConsultorio[]>('/consultorios?activo=true');

    // Cierres de los consultorios donde atiende: se ven en el almanaque, solo de lectura
    const idsDelMedico = new Set((medico?.consultorios ?? []).map((c) => c.id));
    const cierres: Marcado[] = (consultorios ?? [])
        .filter((c) => idsDelMedico.has(c.id))
        .flatMap((c) =>
            (c.cierres ?? []).map((r) => ({
                desde: r.desde,
                hasta: r.hasta,
                tipo: 'cierre' as const,
                etiqueta: `Consultorio ${c.nombre} cerrado${r.motivo ? `: ${r.motivo}` : ''}`,
            })),
        );

    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h1 className={styles.titulo}>
                    {esPropio ? 'Mis ausencias' : medico ? `Ausencias de ${medico.apellido}, ${medico.nombre}` : 'Ausencias'}
                </h1>

                {isLoading && (
                    <Placeholder animation="glow" aria-busy="true">
                        <Placeholder xs={12} style={{ height: '16rem', borderRadius: 12 }} />
                    </Placeholder>
                )}
                {!isLoading && (error || !medico) && (
                    <>
                        <Alert variant="danger">No se pudieron cargar los datos del médico.</Alert>
                        <Link to={esPropio ? '/inicio' : '/horarios'} className={`btn ${styles.botonSecundario}`}>Volver</Link>
                    </>
                )}
                {medico && (
                    <PanelAusencias
                        tipo="ausencia"
                        ruta={`${base}/ausencias`}
                        rangos={medico.ausencias ?? []}
                        marcasExtra={cierres}
                        onCambio={refetch}
                    />
                )}
            </div>
        </div>
    );
};

export default AusenciasMedico;