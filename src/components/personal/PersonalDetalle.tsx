import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Placeholder } from 'react-bootstrap';
import { useFetch } from '../../hooks/useFetch';
import { obtenerRol } from '../utils/sesion';
import { formatoNacimiento, textoEdad } from '../utils/Edad';
import styles from '../utils/Formulario.module.scss';
import { ETIQUETA_ROL, ETIQUETA_TURNO, type IPersonal } from '../../types/Personal.types';

const Dato = ({ etiqueta, valor }: { etiqueta: string; valor?: string | undefined }) => (
    <div className={styles.campo}>
        <span className={styles.label}>{etiqueta}</span>
        <span>{valor || '—'}</span>
    </div>
);

const Seccion = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <fieldset className={styles.seccion}>
        <legend className={styles.seccionTitulo}>{titulo}</legend>
        <div className={styles.grilla}>{children}</div>
    </fieldset>
);

const PersonalDetalle = () => {
    const { id } = useParams<{ id: string }>();
    const esAdmin = obtenerRol() === 'ADMIN';
    const { data: p, isLoading, error } = useFetch<IPersonal>(id ? `/personal/${id}` : null);

    if (isLoading) {
        return (
            <div className={styles.pagina} aria-busy="true">
                <div className={styles.contenedorFormulario}>
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
                    <Alert variant="danger">No encontramos a esa persona.</Alert>
                    <Link to="/personal" className={`btn ${styles.botonSecundario}`}>Volver al personal</Link>
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
                <p className={styles.ayuda} style={{ textAlign: 'center' }}>{ETIQUETA_ROL[p.rol]}</p>

                <Seccion titulo="Datos personales">
                    <Dato etiqueta="Nombre" valor={p.nombre} />
                    <Dato etiqueta="Apellido" valor={p.apellido} />
                    {/* El DNI, el nacimiento, el ingreso y el usuario solo los ve el administrador */}
                    {esAdmin && <Dato etiqueta="DNI" valor={p.dni} />}
                    {esAdmin && (
                        <Dato
                            etiqueta="Fecha de nacimiento"
                            valor={p.fechaNacimiento ? `${formatoNacimiento(p.fechaNacimiento)} (${textoEdad(p.fechaNacimiento)})` : 'Sin cargar'}
                        />
                    )}
                    <Dato etiqueta="Email" valor={p.email} />
                </Seccion>

                <Seccion titulo="Contacto">
                    <Dato etiqueta="Teléfono" valor={p.telefono ? `(${p.telefono.codigoArea}) ${p.telefono.numero}` : undefined} />
                </Seccion>

                <Seccion titulo="Datos laborales">
                    <Dato etiqueta="Rol" valor={ETIQUETA_ROL[p.rol]} />
                    <Dato etiqueta="Turno" valor={p.turno ? ETIQUETA_TURNO[p.turno] : undefined} />
                    {esAdmin && (
                        <Dato etiqueta="Fecha de ingreso" valor={p.fechaIngreso ? formatoNacimiento(p.fechaIngreso) : undefined} />
                    )}
                    {esAdmin && <Dato etiqueta="Usuario de acceso" valor={p.user} />}
                </Seccion>

                <div className={styles.acciones}>
                    <Link to="/personal" className={`btn ${styles.botonSecundario}`}>Volver al personal</Link>
                    {esAdmin && !inactivo && (
                        <Link to={`/personal/editar/${p.id}`} className={`btn ${styles.botonPrincipal}`}>Editar</Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalDetalle;