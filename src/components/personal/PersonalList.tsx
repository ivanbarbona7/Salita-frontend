import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Form, Placeholder, Table } from 'react-bootstrap';
import { PersonBadge, PlusLg } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import { obtenerRol } from '../utils/sesion';
import ModalConfirmar from '../utils/ModalConfirmar';
import BotonAccion from '../utils/BotonAccion';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import formulario from '../utils/Formulario.module.scss';
import styles from '../medicos/MedicoList.module.scss';
import { ETIQUETA_ROL, ETIQUETA_TURNO, type IPersonal } from '../../types/Personal.types';

// Sin tildes ni mayúsculas, para que "perez" encuentre "Pérez"
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const telefonoDe = (p: IPersonal) => (p.telefono ? `(${p.telefono.codigoArea}) ${p.telefono.numero}` : '—');

const PersonalList = () => {
    // Todos ven la lista; solo el administrador carga, edita y desactiva
    const esAdmin = obtenerRol() === 'ADMIN';
    const [busqueda, setBusqueda] = useState('');
    const [verInactivos, setVerInactivos] = useState(false);
    const [aCambiar, setACambiar] = useState<IPersonal | null>(null);

    const { data, isLoading, error, refetch } = useFetch<IPersonal[]>(
        verInactivos ? '/personal?inactivos=true' : '/personal',
    );

    // La lista es corta: se filtra acá, sin volver a consultar en cada letra
    const palabras = normalizar(busqueda.trim()).split(/\s+/).filter(Boolean);
    const filtrados = (data ?? []).filter((p) => {
        const texto = normalizar(`${p.nombre} ${p.apellido} ${p.email} ${p.dni ?? ''}`);
        return palabras.every((palabra) => texto.includes(palabra));
    });

    const confirmarCambio = async () => {
        if (!aCambiar) return;
        const accion = aCambiar.activo === false ? 'reactivar' : 'desactivar';
        try {
            await clientesAxios.patch(`/personal/${aCambiar.id}/${accion}`);
            toast.success(accion === 'desactivar' ? 'Persona desactivada' : 'Persona reactivada');
            await refetch();
        } catch (e) {
            toast.error(obtenerMensajeError(e), { duration: 8000 });
        } finally {
            setACambiar(null);
        }
    };

    const rolDe = (p: IPersonal) => <Badge bg={p.rol === 'ADMIN' ? 'primary' : 'info'}>{ETIQUETA_ROL[p.rol]}</Badge>;
    const turnoDe = (p: IPersonal) => (p.turno ? ETIQUETA_TURNO[p.turno] : '—');

    const Acciones = ({ p }: { p: IPersonal }) => {
        const activo = p.activo !== false;
        return (
            <div className="d-inline-flex flex-wrap gap-2">
                <BotonAccion tipo="ver" to={`/personal/${p.id}`} />
                {esAdmin && activo && <BotonAccion tipo="editar" to={`/personal/editar/${p.id}`} />}
                {esAdmin && <BotonAccion tipo={activo ? 'desactivar' : 'reactivar'} onClick={() => setACambiar(p)} />}
            </div>
        );
    };

    return (
        <div className={formulario.pagina}>
            <div className={styles.contenedor}>
                <div className={styles.encabezado}>
                    <h3 className={styles.titulo}>
                        <PersonBadge size={30} />
                        Personal
                    </h3>
                    {esAdmin && (
                        <Link to="/personal/nuevo" className={`btn ${formulario.botonPrincipal}`}>
                            <PlusLg size={16} /> Nuevo personal
                        </Link>
                    )}
                </div>

                <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    <Form.Control
                        type="search"
                        className={styles.buscador}
                        style={{ marginBottom: 0 }}
                        placeholder="Buscar por nombre, apellido o email"
                        aria-label="Buscar personal"
                        value={busqueda}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
                    />
                    {esAdmin && (
                        <Form.Check
                            type="switch"
                            id="ver-inactivos-personal"
                            label="Ver inactivos"
                            checked={verInactivos}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerInactivos(e.target.checked)}
                        />
                    )}
                </div>

                {error && (
                    <Alert variant="danger" className="d-flex justify-content-between align-items-center">
                        No pudimos cargar el personal.
                        <Button size="sm" variant="outline-danger" onClick={() => void refetch()}>Reintentar</Button>
                    </Alert>
                )}

                {isLoading && (
                    <Placeholder animation="glow" aria-busy="true">
                        {Array.from({ length: 5 }, (_, i) => (
                            <Placeholder key={i} xs={12} style={{ height: '3.2rem', borderRadius: 12, marginBottom: 10 }} />
                        ))}
                    </Placeholder>
                )}

                {!isLoading && data && filtrados.length === 0 && (
                    <Alert variant="light" className="text-center">
                        {busqueda
                            ? `No hay personal que coincida con “${busqueda.trim()}”.`
                            : verInactivos ? 'No hay personal desactivado.' : 'Todavía no hay personal cargado.'}
                    </Alert>
                )}

                {!isLoading && filtrados.length > 0 && (
                    <>
                        {/* Escritorio: tabla */}
                        <Table hover responsive className={`d-none d-md-table align-middle ${styles.tabla}`}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Rol</th>
                                    <th>Turno</th>
                                    <th>Teléfono</th>
                                    <th className="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map((p) => (
                                    <tr key={p.id} className={p.activo === false ? styles.filaInactiva : undefined}>
                                        <td>
                                            <div className="fw-semibold">
                                                {p.apellido}, {p.nombre}
                                                {p.activo === false && <Badge bg="secondary" className="ms-2">Inactivo</Badge>}
                                            </div>
                                            <div className="small text-muted">{p.email}</div>
                                        </td>
                                        <td>{rolDe(p)}</td>
                                        <td>{turnoDe(p)}</td>
                                        <td className="text-nowrap">{telefonoDe(p)}</td>
                                        <td className="text-end"><Acciones p={p} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {/* Celular: tarjetas */}
                        <div className="d-md-none d-grid gap-3">
                            {filtrados.map((p) => (
                                <div key={p.id} className={styles.tarjeta}>
                                    <div className={styles.tarjetaTitulo}>
                                        <strong>{p.apellido}, {p.nombre}</strong>
                                        {rolDe(p)}
                                    </div>
                                    {p.activo === false && <Badge bg="secondary" className="mb-2">Inactivo</Badge>}
                                    <div className={styles.dato}>{p.email}</div>
                                    <div className={styles.dato}>Turno: {turnoDe(p)} · Tel.: {telefonoDe(p)}</div>
                                    <div className="mt-3"><Acciones p={p} /></div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <ModalConfirmar
                    show={aCambiar !== null}
                    titulo={aCambiar?.activo === false ? 'Reactivar persona' : 'Desactivar persona'}
                    mensaje={
                        aCambiar?.activo === false
                            ? `¿Querés que ${aCambiar?.nombre} ${aCambiar?.apellido} vuelva a poder ingresar al sistema?`
                            : `¿Querés desactivar a ${aCambiar?.nombre} ${aCambiar?.apellido}? No va a poder ingresar al sistema, pero su registro se conserva y se puede reactivar.`
                    }
                    textoConfirmar={aCambiar?.activo === false ? 'Sí, reactivar' : 'Sí, desactivar'}
                    variante={aCambiar?.activo === false ? 'success' : 'danger'}
                    onConfirmar={confirmarCambio}
                    onCancelar={() => setACambiar(null)}
                />
            </div>
        </div>
    );
};

export default PersonalList;