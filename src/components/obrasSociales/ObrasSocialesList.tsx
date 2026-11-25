import { useState } from 'react';
import { Alert, Badge, Button, Container, Form, InputGroup, Modal, Placeholder, Table } from 'react-bootstrap';
import { PlusLg, ShieldPlus } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import ModalConfirmar from '../utils/ModalConfirmar';
import BotonAccion from '../utils/BotonAccion';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import formulario from '../utils/Formulario.module.scss';
import styles from '../medicos/MedicoList.module.scss';
import type { IObraSocialItem } from '../../types/ObraSocial.types';

type Pendiente = { tipo: 'desactivar' | 'reactivar' | 'eliminar'; obra: IObraSocialItem };

interface RenombrarProps {
    obra: IObraSocialItem | null;
    onGuardar: (obra: IObraSocialItem, nombre: string) => Promise<void>;
    onCerrar: () => void;
}

// Se monta de nuevo (con key) por cada obra social, así el campo arranca con su nombre actual
const ModalRenombrar = ({ obra, onGuardar, onCerrar }: RenombrarProps) => {
    const [nombre, setNombre] = useState(obra?.nombre ?? '');
    const [guardando, setGuardando] = useState(false);

    const guardar = async () => {
        if (!obra) return;
        setGuardando(true);
        try {
            await onGuardar(obra, nombre);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal show={obra !== null} onHide={onCerrar} centered>
            <Modal.Header closeButton>
                <Modal.Title>Corregir nombre</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Label htmlFor="renombrar-obra">Nombre de la obra social</Form.Label>
                <Form.Control
                    id="renombrar-obra"
                    style={{ textTransform: 'uppercase' }}
                    maxLength={60}
                    autoComplete="off"
                    value={nombre}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
                />
                <Form.Text className="text-muted">
                    El cambio se aplica también a los pacientes que ya tienen esta obra social.
                </Form.Text>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onCerrar} disabled={guardando}>Cancelar</Button>
                <Button className={formulario.botonPrincipal} onClick={() => void guardar()} disabled={guardando || nombre.trim().length < 2}>
                    {guardando ? 'Guardando…' : 'Guardar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ObrasSocialesList = () => {
    const { data, isLoading, error, refetch } = useFetch<IObraSocialItem[]>('/obras-sociales');
    const [nueva, setNueva] = useState('');
    const [agregando, setAgregando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [pendiente, setPendiente] = useState<Pendiente | null>(null);
    const [aRenombrar, setARenombrar] = useState<IObraSocialItem | null>(null);

    const filtradas = (data ?? []).filter((o) => normalizar(o.nombre).includes(normalizar(busqueda.trim())));

    const agregar = async () => {
        if (nueva.trim().length < 2) return;
        setAgregando(true);
        try {
            await clientesAxios.post('/obras-sociales', { nombre: nueva });
            toast.success('Obra social cargada');
            setNueva('');
            await refetch();
        } catch (e: unknown) {
            toast.error(obtenerMensajeError(e));
        } finally {
            setAgregando(false);
        }
    };

    const renombrar = async (obra: IObraSocialItem, nombre: string) => {
        try {
            await clientesAxios.put(`/obras-sociales/${obra.id}`, { nombre });
            toast.success('Nombre actualizado');
            setARenombrar(null);
            await refetch();
        } catch (e: unknown) {
            toast.error(obtenerMensajeError(e));
        }
    };

    const confirmar = async () => {
        if (!pendiente) return;
        const { tipo, obra } = pendiente;
        try {
            if (tipo === 'eliminar') await clientesAxios.delete(`/obras-sociales/${obra.id}`);
            else await clientesAxios.patch(`/obras-sociales/${obra.id}/${tipo}`);
            toast.success(tipo === 'eliminar' ? 'Obra social eliminada' : tipo === 'desactivar' ? 'Obra social desactivada' : 'Obra social reactivada');
            await refetch();
        } catch (e: unknown) {
            toast.error(obtenerMensajeError(e), { duration: 8000 });
        } finally {
            setPendiente(null);
        }
    };

    const Acciones = ({ o }: { o: IObraSocialItem }) =>
        o.esSistema ? (
            <span className="text-muted small">Por defecto</span>
        ) : (
            <div className="d-inline-flex flex-wrap gap-2">
                <BotonAccion tipo="editar" onClick={() => setARenombrar(o)} />
                <BotonAccion
                    tipo={o.activo ? 'desactivar' : 'reactivar'}
                    onClick={() => setPendiente({ tipo: o.activo ? 'desactivar' : 'reactivar', obra: o })}
                />
                {(o.enUso ?? 0) === 0 && <BotonAccion tipo="eliminar" onClick={() => setPendiente({ tipo: 'eliminar', obra: o })} />}
            </div>
        );

    const estado = (o: IObraSocialItem) => <Badge bg={o.activo ? 'success' : 'secondary'}>{o.activo ? 'Activa' : 'Desactivada'}</Badge>;

    return (
        <div className={formulario.pagina}>
            <Container fluid className={styles.contenedor}>
                <div className={styles.encabezado}>
                    <h3 className={styles.titulo}>
                        <ShieldPlus size={30} />
                        Obras sociales
                    </h3>
                </div>

                <p className="text-muted">
                    Estas son las obras sociales que se pueden elegir al cargar un paciente. “NINGUNA” es la opción por defecto.
                </p>

                <InputGroup className="mb-4" style={{ maxWidth: 520 }}>
                    <Form.Control
                        placeholder="Nueva obra social (ej.: JERÁRQUICOS SALUD)"
                        aria-label="Nombre de la nueva obra social"
                        style={{ textTransform: 'uppercase' }}
                        maxLength={60}
                        autoComplete="off"
                        value={nueva}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNueva(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                void agregar();
                            }
                        }}
                    />
                    <Button className={formulario.botonPrincipal} onClick={() => void agregar()} disabled={agregando || nueva.trim().length < 2}>
                        <PlusLg size={16} /> Agregar
                    </Button>
                </InputGroup>

                <Form.Control
                    type="search"
                    className={styles.buscador}
                    placeholder="Buscar obra social"
                    aria-label="Buscar obra social"
                    value={busqueda}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
                />

                {error && (
                    <Alert variant="danger" className="d-flex justify-content-between align-items-center">
                        No pudimos cargar las obras sociales.
                        <Button size="sm" variant="outline-danger" onClick={() => void refetch()}>Reintentar</Button>
                    </Alert>
                )}

                {isLoading && (
                    <Placeholder animation="glow" aria-busy="true">
                        {Array.from({ length: 5 }, (_, i) => (
                            <Placeholder key={i} xs={12} style={{ height: '3rem', borderRadius: 12, marginBottom: 10 }} />
                        ))}
                    </Placeholder>
                )}

                {!isLoading && data && filtradas.length === 0 && (
                    <Alert variant="light" className="text-center">No hay obras sociales que coincidan.</Alert>
                )}

                {!isLoading && filtradas.length > 0 && (
                    <>
                        <Table hover responsive className={`d-none d-md-table align-middle ${styles.tabla}`}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Pacientes</th>
                                    <th>Estado</th>
                                    <th className="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtradas.map((o) => (
                                    <tr key={o.id} className={o.activo ? undefined : styles.filaInactiva}>
                                        <td className="fw-semibold">{o.nombre}</td>
                                        <td>{o.enUso ?? 0}</td>
                                        <td>{estado(o)}</td>
                                        <td className="text-end"><Acciones o={o} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        <div className="d-md-none d-grid gap-3">
                            {filtradas.map((o) => (
                                <div key={o.id} className={o.activo ? styles.tarjeta : `${styles.tarjeta} ${styles.tarjetaInactiva}`}>
                                    <div className={styles.tarjetaTitulo}>
                                        <strong>{o.nombre}</strong>
                                        {estado(o)}
                                    </div>
                                    <div className={styles.dato}>{o.enUso ?? 0} pacientes</div>
                                    <Acciones o={o} />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <ModalRenombrar key={aRenombrar?.id ?? 'ninguna'} obra={aRenombrar} onGuardar={renombrar} onCerrar={() => setARenombrar(null)} />

                <ModalConfirmar
                    show={pendiente !== null}
                    titulo={
                        pendiente?.tipo === 'eliminar' ? 'Eliminar obra social'
                            : pendiente?.tipo === 'reactivar' ? 'Reactivar obra social' : 'Desactivar obra social'
                    }
                    mensaje={
                        pendiente?.tipo === 'eliminar'
                            ? `¿Eliminar “${pendiente.obra.nombre}”? Ningún paciente la tiene, así que no se pierde nada.`
                            : pendiente?.tipo === 'reactivar'
                                ? `¿Volver a ofrecer “${pendiente.obra.nombre}” al cargar pacientes?`
                                : pendiente
                                    ? `¿Desactivar “${pendiente.obra.nombre}”? Deja de aparecer para elegir, pero los pacientes que ya la tienen la conservan.`
                                    : ''
                    }
                    textoConfirmar={
                        pendiente?.tipo === 'eliminar' ? 'Sí, eliminar' : pendiente?.tipo === 'reactivar' ? 'Sí, reactivar' : 'Sí, desactivar'
                    }
                    variante={pendiente?.tipo === 'reactivar' ? 'success' : 'danger'}
                    onConfirmar={confirmar}
                    onCancelar={() => setPendiente(null)}
                />
            </Container>
        </div>
    );
};

export default ObrasSocialesList;