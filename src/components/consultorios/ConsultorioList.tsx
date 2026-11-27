import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Container, Form, Table } from 'react-bootstrap';
import { Building, PlusLg } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import { obtenerRol } from '../utils/sesion';
import ListSkeleton from '../utils/ListSkeleton';
import ModalConfirmar from '../utils/ModalConfirmar';
import BotonAccion from '../utils/BotonAccion';
import VistaRapidaConsultorio from './VistaRapidaConsultorio';
import formulario from '../utils/Formulario.module.scss';
import styles from './ConsultorioList.module.scss';
import type { IConsultorio } from '../../types/Consultorio.types';

// Sin tildes ni mayúsculas, para que "cordoba" encuentre "Córdoba"
const normalizar = (texto: string) =>
    texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const responsable = (c: IConsultorio) =>
    c.profesionalResponsable ? `${c.profesionalResponsable.apellido}, ${c.profesionalResponsable.nombre}` : 'Sin responsable';

interface AccionesProps {
    consultorio: IConsultorio;
    esAdmin: boolean;
    onVer: (id: string) => void;
    onDesactivar: (consultorio: IConsultorio) => void;
}

// "Ver" lo tienen todos; Editar y Desactivar, solo el administrador
const Acciones = ({ consultorio, esAdmin, onVer, onDesactivar }: AccionesProps) => (
    <div className="d-flex gap-2">
        <BotonAccion tipo="ver" onClick={() => onVer(consultorio.id)} />
        {esAdmin && <BotonAccion tipo="editar" to={`/consultorios/editar/${consultorio.id}`} />}
        {esAdmin && <BotonAccion tipo="cierres" to={`/consultorios/${consultorio.id}/cierres`} />}
        {esAdmin && consultorio.activo !== false && (
            <BotonAccion tipo="desactivar" onClick={() => onDesactivar(consultorio)} />
        )}
    </div>
);

const ConsultorioList = () => {
    const { data: consultorios, setData: setConsultorios, isLoading, error } = useFetch<IConsultorio[]>('/consultorios');
    const [busqueda, setBusqueda] = useState('');
    const [aDesactivar, setADesactivar] = useState<IConsultorio | null>(null);
    const [idVista, setIdVista] = useState<string | null>(null);
    const esAdmin = obtenerRol() === 'ADMIN';

    const lista = consultorios ?? [];
    // Se busca en la lista para que la vista rápida se actualice sola (por ejemplo, al desactivar)
    const consultorioVisto = lista.find((c) => c.id === idVista) ?? null;
    const termino = normalizar(busqueda.trim());
    const filtrados = lista.filter((c) =>
        normalizar(
            `${c.nombre} ${c.ciudad} ${responsable(c)} ${c.todasLasEspecialidades ? 'todas las especialidades' : c.especialidades.map((e) => e.nombre).join(' ')} ${(c.medicos ?? []).map((m) => `${m.apellido} ${m.nombre}`).join(' ')}`,
        ).includes(termino),
    );

    const confirmarDesactivar = async () => {
        if (!aDesactivar) return;
        try {
            await clientesAxios.delete(`/consultorios/${aDesactivar.id}`);
            toast.success('Consultorio desactivado correctamente');
            // No se quita de la lista: queda marcado como inactivo y se puede reactivar desde Editar
            setConsultorios(lista.map((c) => (c.id === aDesactivar.id ? { ...c, activo: false } : c)));
        } catch (err: unknown) {
            toast.error(obtenerMensajeError(err));
        } finally {
            setADesactivar(null);
        }
    };

    if (isLoading) return <ListSkeleton rows={5} />;

    return (
        <div className={formulario.pagina}>
            <Container fluid className={styles.contenedor}>
                <div className={styles.encabezado}>
                    <h3 className={styles.titulo}>
                        <Building size={30} />
                        Consultorios
                    </h3>
                    {esAdmin && (
                        <Link to="/consultorios/nuevo" className={`btn ${formulario.botonPrincipal}`}>
                            <PlusLg size={16} /> Nuevo consultorio
                        </Link>
                    )}
                </div>

                <Form.Control
                    type="search"
                    className={styles.buscador}
                    placeholder="Buscar por nombre, ciudad, responsable o especialidad"
                    aria-label="Buscar consultorio"
                    value={busqueda}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
                />

                {error && <Alert variant="danger">No pudimos cargar los consultorios.</Alert>}

                {filtrados.length === 0 ? (
                    <Alert variant="light" className="text-center">
                        {lista.length === 0 ? 'Todavía no hay consultorios cargados.' : 'No se encontraron consultorios.'}
                    </Alert>
                ) : (
                    <>
                        {/* Escritorio: tabla */}
                        <Table responsive hover className={`d-none d-md-table align-middle ${styles.tabla}`}>
                            <thead>
                                <tr>
                                    <th>Consultorio</th>
                                    <th>Responsable</th>
                                    <th>Especialidades</th>
                                    <th>Médicos</th>
                                    <th>Estado</th>
                                    <th className={`text-end ${styles.colAcciones}`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map((c) => {
                                    const activo = c.activo !== false;
                                    return (
                                        <tr key={c.id} className={activo ? undefined : styles.filaInactiva}>
                                            <td>
                                                <strong className={styles.sinCorte}>{c.nombre}</strong>
                                                <div className="small text-muted">{c.ciudad}</div>
                                            </td>
                                            <td className={styles.sinCorte}>{responsable(c)}</td>
                                            <td>
                                                {c.todasLasEspecialidades ? (
                                                    <span className={styles.chipEsp}>Todas las especialidades</span>
                                                ) : (
                                                    c.especialidades.map((e) => (
                                                        <span key={e.id} className={styles.chipEsp}>{e.nombre}</span>
                                                    ))
                                                )}
                                            </td>
                                            <td>
                                                {(c.medicos ?? []).length === 0 ? (
                                                    <span className="small text-muted">Sin médicos</span>
                                                ) : (
                                                    c.medicos?.map((m) => (
                                                        <div key={m.id} className={`small ${styles.sinCorte}`}>{m.apellido}, {m.nombre}</div>
                                                    ))
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg={activo ? 'success' : 'secondary'}>
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </td>
                                            <td className={styles.colAcciones}>
                                                <Acciones consultorio={c} esAdmin={esAdmin} onVer={setIdVista} onDesactivar={setADesactivar} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>

                        {/* Celular: tarjetas */}
                        <div className="d-md-none d-grid gap-3">
                            {filtrados.map((c) => {
                                const activo = c.activo !== false;
                                return (
                                    <div
                                        key={c.id}
                                        className={activo ? styles.tarjeta : `${styles.tarjeta} ${styles.tarjetaInactiva}`}
                                    >
                                        <div className={styles.tarjetaTitulo}>
                                            <strong>{c.nombre}</strong>
                                            <Badge bg={activo ? 'success' : 'secondary'}>
                                                {activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </div>
                                        <div className={styles.dato}>{c.ciudad} · {responsable(c)}</div>
                                        <div>
                                            {c.todasLasEspecialidades ? (
                                                <span className={styles.chipEsp}>Todas las especialidades</span>
                                            ) : (
                                                c.especialidades.map((e) => (
                                                    <span key={e.id} className={styles.chipEsp}>{e.nombre}</span>
                                                ))
                                            )}
                                        </div>
                                        <div className={styles.dato}>
                                            Médicos: {(c.medicos ?? []).length === 0 ? 'ninguno' : c.medicos?.map((m) => m.apellido).join(', ')}
                                        </div>
                                        <div className={styles.acciones}>
                                            <Acciones consultorio={c} esAdmin={esAdmin} onVer={setIdVista} onDesactivar={setADesactivar} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                <VistaRapidaConsultorio
                    consultorio={consultorioVisto}
                    esAdmin={esAdmin}
                    onCerrar={() => setIdVista(null)}
                    onDesactivar={(c) => {
                        setIdVista(null);
                        setADesactivar(c);
                    }}
                />

                <ModalConfirmar
                    show={aDesactivar !== null}
                    titulo="Confirmar desactivación"
                    mensaje={
                        <>
                            ¿Seguro que querés desactivar el consultorio <strong>{aDesactivar?.nombre}</strong>? Podés
                            volver a activarlo desde Editar.
                        </>
                    }
                    textoConfirmar="Sí, desactivar"
                    onConfirmar={confirmarDesactivar}
                    onCancelar={() => setADesactivar(null)}
                />
            </Container>
        </div>
    );
};

export default ConsultorioList;