import { formatoNacimiento, textoEdad } from '../utils/Edad';
import { formatearTelefono } from '../utils/telefono';
import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Placeholder } from 'react-bootstrap';
import { useFetch } from '../../hooks/useFetch';
import { usePermisosPaciente } from '../../hooks/usePermisoPaciente';
import { nombreObraSocial } from '../utils/ObraSocial';
import styles from '../utils/Formulario.module.scss';
import type { IPaciente } from '../../types/Paciente.type';

interface DatoProps {
    etiqueta: string;
    valor?: string | undefined;
}

const Dato = ({ etiqueta, valor }: DatoProps) => (
    <div className={styles.campo}>
        <span className={styles.label}>{etiqueta}</span>
        <span>{valor || '—'}</span>
    </div>
);

interface SeccionProps {
    titulo: string;
    children: React.ReactNode;
}

const Seccion = ({ titulo, children }: SeccionProps) => (
    <fieldset className={styles.seccion}>
        <legend className={styles.seccionTitulo}>{titulo}</legend>
        <div className={styles.grilla}>{children}</div>
    </fieldset>
);

const PacienteDetalle = () => {
    const { id } = useParams<{ id: string }>();
    const permisos = usePermisosPaciente();
    const { data: p, isLoading, error } = useFetch<IPaciente>(id ? `/Pacientes/${id}` : null);

    if (isLoading) {
        return (
            <div className={styles.pagina} aria-busy="true">
                <div className={styles.contenedorFormulario}>
                    <Placeholder as="h3" animation="glow" className="text-center">
                        <Placeholder xs={6} />
                    </Placeholder>
                    {Array.from({ length: 3 }, (_, i) => (
                        <Placeholder key={i} as="div" animation="glow" className="mb-3">
                            <Placeholder xs={12} style={{ height: '7rem', borderRadius: 12 }} />
                        </Placeholder>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !p) {
        return (
            <div className={styles.pagina}>
                <div className={styles.contenedorFormulario}>
                    <Alert variant="danger">No encontramos al paciente.</Alert>
                    <Link to="/pacientes" className={`btn ${styles.botonSecundario}`}>Volver a pacientes</Link>
                </div>
            </div>
        );
    }

    const inactivo = p.activo === false;

    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h3 className={styles.titulo}>
                    {p.apellido}, {p.nombre}
                    {inactivo && <Badge bg="secondary" className="ms-2 fs-6 align-middle">Inactivo</Badge>}
                </h3>
                <p className={styles.ayuda} style={{ textAlign: 'center' }}>
                    DNI {p.dni} · Cargado el {new Date(p.createdAt).toLocaleDateString('es-AR')}
                </p>

                <Seccion titulo="Datos personales">
                    <Dato etiqueta="Nombre" valor={p.nombre} />
                    <Dato etiqueta="Apellido" valor={p.apellido} />
                    <Dato etiqueta="DNI" valor={p.dni} />
                    <Dato
                        etiqueta="Fecha de nacimiento"
                        valor={p.fechaNacimiento ? `${formatoNacimiento(p.fechaNacimiento)} (${textoEdad(p.fechaNacimiento)})` : 'Sin cargar'}
                    />
                    <Dato etiqueta="Email" valor={p.email} />
                </Seccion>

                <Seccion titulo="Dirección">
                    <Dato etiqueta="Calle y número" valor={p.direccion ? `${p.direccion.calle} ${p.direccion.numero}`.trim() : undefined} />
                    <Dato
                        etiqueta="Piso y departamento"
                        valor={p.direccion?.piso || p.direccion?.departamento ? `${p.direccion.piso} ${p.direccion.departamento}`.trim() : undefined}
                    />
                    <Dato etiqueta="Barrio" valor={p.direccion?.barrio} />
                </Seccion>

                <Seccion titulo="Teléfono">
                    <Dato etiqueta="Tipo" valor={p.telefono?.tipo} />
                    <Dato etiqueta="Número" valor={p.telefono?.numero ? formatearTelefono(p.telefono) : undefined} />
                </Seccion>

                <Seccion titulo="Obra social">
                    <Dato etiqueta="Obra social" valor={nombreObraSocial(p.obraSocial)} />
                    <Dato etiqueta="Número de afiliado" valor={p.obraSocial?.numeroAfiliado} />
                </Seccion>

                <div className={styles.acciones}>
                    <Link to="/pacientes" className={`btn ${styles.botonSecundario}`}>Volver</Link>
                    {permisos.verHistoria && (
                        <Link to={`/historia-clinica/${p.id}`} className={`btn ${styles.botonSecundario}`}>Historia clínica</Link>
                    )}
                    {permisos.editar && !inactivo && (
                        <Link to={`/pacientes/editar/${p.id}`} className={`btn ${styles.botonPrincipal}`}>Editar</Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PacienteDetalle;