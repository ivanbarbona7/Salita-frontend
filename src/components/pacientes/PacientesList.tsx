import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, ButtonGroup, Container, Form, Pagination, Placeholder, Table } from 'react-bootstrap';
import { PlusLg, People, Clipboard } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import ModalConfirmar from '../utils/ModalConfirmar';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import { formatearTelefono } from '../utils/telefono';
import BotonAccion from '../utils/BotonAccion';
import formulario from '../utils/Formulario.module.scss';
import { usePermisosPaciente } from '../../hooks/usePermisoPaciente';
import type { IPacienteLista, IPaginado } from '../../types/Paciente.type';
import styles from './PacienteList.module.scss';

type Campo = 'apellido' | 'nombre';
const POR_PAGINA = 10;

interface AccionesProps {
    id: string;
    verHistoria: boolean;
    editar: boolean;
    activo: boolean;
    puedeDesactivar: boolean;
    onCambiarEstado: () => void;
}

const Acciones = ({ id, verHistoria, editar, activo, puedeDesactivar, onCambiarEstado }: AccionesProps) => (
    <div className="d-inline-flex flex-wrap gap-2">
        {verHistoria && <BotonAccion tipo="historia" to={`/historia-clinica/${id}`} />}
        {editar && activo && <BotonAccion tipo="editar" to={`/pacientes/editar/${id}`} />}
        {puedeDesactivar && <BotonAccion tipo={activo ? 'desactivar' : 'reactivar'} onClick={onCambiarEstado} />}
    </div>
);

// Copia al portapapeles. navigator.clipboard solo existe en páginas seguras (https o localhost):
// si no está, se usa el método viejo para que también funcione dentro de una red local.
const copiarTexto = async (texto: string) => {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(texto);
        return;
    }
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(campo);
    if (!ok) throw new Error('No se pudo copiar');
};

// Botón chico para copiar un dato (DNI, teléfono). No abre el detalle del paciente.
const BotonCopiar = ({ texto, etiqueta }: { texto: string; etiqueta: string }) => (
    <button
        type="button"
        className={styles.copiar}
        title={`Copiar ${etiqueta}`}
        aria-label={`Copiar ${etiqueta}`}
        onClick={(e) => {
            e.stopPropagation();
            copiarTexto(texto)
                .then(() => toast.success(`${etiqueta} copiado`))
                .catch(() => toast.error('No se pudo copiar'));
        }}
    >
        <Clipboard size={14} aria-hidden="true" />
    </button>
);

interface PaginacionProps {
    page: number;
    totalPages: number;
    onChange: (pagina: number) => void;
}

const Paginacion = ({ page, totalPages, onChange }: PaginacionProps) => {
    const desde = Math.max(1, Math.min(page - 2, totalPages - 4));
    const paginas = Array.from({ length: Math.min(5, totalPages) }, (_, i) => desde + i);

    return (
        <Pagination className={`mb-0 ${styles.paginacion}`}>
            <Pagination.Prev disabled={page === 1} onClick={() => onChange(page - 1)} />
            {paginas.map((n) => (
                <Pagination.Item key={n} active={n === page} onClick={() => onChange(n)}>{n}</Pagination.Item>
            ))}
            <Pagination.Next disabled={page === totalPages} onClick={() => onChange(page + 1)} />
        </Pagination>
    );
};

const PacienteList = () => {
    const permisos = usePermisosPaciente();
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const timer = useRef<number | undefined>(undefined);
    const [aCambiar, setACambiar] = useState<IPacienteLista | null>(null);

    // Todo el estado vive en la URL: se puede compartir, y "atrás" del navegador funciona.
    const q = params.get('q') ?? '';
    const page = Math.max(1, Number(params.get('page')) || 1);
    const sort: Campo = params.get('sort') === 'nombre' ? 'nombre' : 'apellido';
    const order = params.get('order') === 'desc' ? 'desc' : 'asc';
    const verInactivos = params.get('inactivos') === '1';

    const query = new URLSearchParams({ q, page: String(page), limit: String(POR_PAGINA), sort, order });
    if (verInactivos) query.set('inactivos', 'true');
    const { data, isLoading, error, refetch } = useFetch<IPaginado<IPacienteLista>>(`/Pacientes?${query.toString()}`);

    const actualizar = (cambios: Record<string, string>) =>
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries(cambios).forEach(([clave, valor]) => (valor ? next.set(clave, valor) : next.delete(clave)));
            return next;
        });

    // Espera 400 ms después de la última tecla para no consultar en cada letra.
    const onBuscar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value.trim();
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => actualizar({ q: valor, page: '1' }), 400);
    };

    const ordenarPor = (campo: Campo) =>
        actualizar({ sort: campo, order: sort === campo && order === 'asc' ? 'desc' : 'asc', page: '1' });

    // Desactivar o reactivar. Con turnos pendientes el servidor no deja desactivar y explica por qué.
    const confirmarCambio = async () => {
        if (!aCambiar) return;
        const accion = aCambiar.activo === false ? 'reactivar' : 'desactivar';
        try {
            await clientesAxios.patch(`/Pacientes/${aCambiar.id}/${accion}`);
            toast.success(accion === 'desactivar' ? 'Paciente desactivado' : 'Paciente reactivado');
            await refetch();
        } catch (e) {
            toast.error(obtenerMensajeError(e), { duration: 10000 });
        } finally {
            setACambiar(null);
        }
    };

    // Tocar la fila abre el detalle. Si la persona estaba seleccionando texto (para copiarlo), no se navega.
    const irAlDetalle = (id: string) => {
        if (window.getSelection()?.toString()) return;
        navigate(`/pacientes/${id}`);
    };
    const alTeclear = (e: React.KeyboardEvent, id: string) => {
        if (e.target === e.currentTarget && e.key === 'Enter') irAlDetalle(id);
    };

    const flecha = (campo: Campo) => (sort === campo ? (order === 'asc' ? ' ▲' : ' ▼') : ' ↕');
    const ariaOrden = (campo: Campo) => (sort === campo ? (order === 'asc' ? 'ascending' : 'descending') : 'none');

    return (
        <div className={formulario.pagina}>
        <Container fluid className={styles.contenedor}>
            <div className={styles.encabezado}>
                <h3 className={styles.titulo}>
                    <People size={30} />
                    Pacientes
                </h3>
                {permisos.editar && (
                    <Link to="/nuevo-paciente" className={`btn ${formulario.botonPrincipal}`}>
                        <PlusLg size={16} /> Nuevo paciente
                    </Link>
                )}
            </div>

            <div className={styles.barra}>
                <Form.Control
                    type="search"
                    className={styles.buscador}
                    placeholder="Buscar por nombre, apellido o DNI"
                    aria-label="Buscar paciente"
                    defaultValue={q}
                    onChange={onBuscar}
                />
                <Form.Check
                    type="switch"
                    id="ver-inactivos"
                    label="Ver inactivos"
                    checked={verInactivos}
                    onChange={(e) => actualizar({ inactivos: e.target.checked ? '1' : '', page: '1' })}
                />
                {/* En celular no hay encabezados de tabla, así que el orden se elige acá */}
                <ButtonGroup size="sm" className="d-md-none" aria-label="Ordenar por">
                    <Button variant="outline-secondary" active={sort === 'apellido'} onClick={() => ordenarPor('apellido')}>
                        Apellido{flecha('apellido')}
                    </Button>
                    <Button variant="outline-secondary" active={sort === 'nombre'} onClick={() => ordenarPor('nombre')}>
                        Nombre{flecha('nombre')}
                    </Button>
                </ButtonGroup>
            </div>

            {error && (
                <Alert variant="danger" className="d-flex justify-content-between align-items-center">
                    No pudimos cargar los pacientes.
                    <Button size="sm" variant="outline-danger" onClick={() => void refetch()}>Reintentar</Button>
                </Alert>
            )}

            {isLoading && (
                <Placeholder animation="glow" aria-busy="true">
                    {Array.from({ length: POR_PAGINA }, (_, i) => (
                        <Placeholder key={i} xs={12} className={styles.esqueleto} />
                    ))}
                </Placeholder>
            )}

            {!isLoading && data && data.items.length === 0 && (
                <Alert variant="light" className="text-center">
                    {q
                        ? `No hay pacientes que coincidan con “${q}”. Probá con otro nombre o DNI.`
                        : verInactivos ? 'No hay pacientes desactivados.' : 'Todavía no hay pacientes cargados.'}
                </Alert>
            )}

            {!isLoading && data && data.items.length > 0 && (
                <>
                    {/* Escritorio: tabla */}
                    <Table hover responsive className={`d-none d-md-table align-middle ${styles.tabla}`}>
                        <thead>
                            <tr>
                                <th
                                    className={styles.ordenable}
                                    role="button"
                                    tabIndex={0}
                                    aria-sort={ariaOrden('apellido')}
                                    onClick={() => ordenarPor('apellido')}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLTableCellElement>) => e.key === 'Enter' && ordenarPor('apellido')}
                                >
                                    Apellido{flecha('apellido')}
                                </th>
                                <th
                                    className={styles.ordenable}
                                    role="button"
                                    tabIndex={0}
                                    aria-sort={ariaOrden('nombre')}
                                    onClick={() => ordenarPor('nombre')}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLTableCellElement>) => e.key === 'Enter' && ordenarPor('nombre')}
                                >
                                    Nombre{flecha('nombre')}
                                </th>
                                <th>DNI</th>
                                <th>Teléfono</th>
                                <th>Obra social</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((p) => (
                                <tr
                                    key={p.id}
                                    className={`${styles.filaClicable} ${p.activo === false ? styles.filaInactiva : ''}`}
                                    tabIndex={0}
                                    onClick={() => irAlDetalle(p.id)}
                                    onKeyDown={(e) => alTeclear(e, p.id)}
                                >
                                    <td className="fw-semibold">
                                        {p.apellido}
                                        {p.activo === false && <Badge bg="secondary" className="ms-2">Inactivo</Badge>}
                                    </td>
                                    <td>{p.nombre}</td>
                                    <td className="text-nowrap">
                                        {p.dni} <BotonCopiar texto={p.dni} etiqueta="DNI" />
                                    </td>
                                    <td className="text-nowrap">
                                        {p.telefono?.numero ? (
                                            <>
                                                {formatearTelefono(p.telefono)}{' '}
                                                <BotonCopiar texto={formatearTelefono(p.telefono)} etiqueta="Teléfono" />
                                            </>
                                        ) : '—'}
                                    </td>
                                    <td>{p.obraSocial?.nombre ? <span className={styles.chip}>{p.obraSocial.nombre}</span> : '—'}</td>
                                    <td className="text-end" onClick={(e) => e.stopPropagation()}>
                                        <Acciones
                                            id={p.id}
                                            verHistoria={permisos.verHistoria}
                                            editar={permisos.editar}
                                            activo={p.activo !== false}
                                            puedeDesactivar={permisos.desactivar}
                                            onCambiarEstado={() => setACambiar(p)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {/* Celular: tarjetas */}
                    <div className="d-md-none d-grid gap-3">
                        {data.items.map((p) => (
                            <div
                                key={p.id}
                                className={`${p.activo === false ? `${styles.tarjeta} ${styles.tarjetaInactiva}` : styles.tarjeta} ${styles.filaClicable}`}
                                onClick={() => irAlDetalle(p.id)}
                            >
                                <div className={styles.tarjetaTitulo}>
                                    <strong>{p.apellido}, {p.nombre}</strong>
                                    {p.activo === false && <Badge bg="secondary">Inactivo</Badge>}
                                </div>
                                <div className={styles.dato}>
                                    DNI {p.dni} <BotonCopiar texto={p.dni} etiqueta="DNI" />
                                    {p.telefono?.numero && (
                                        <>
                                            {' · '}Tel. {formatearTelefono(p.telefono)}{' '}
                                            <BotonCopiar texto={formatearTelefono(p.telefono)} etiqueta="Teléfono" />
                                        </>
                                    )}
                                    {p.obraSocial?.nombre ? ` · ${p.obraSocial.nombre}` : ''}
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Acciones
                                        id={p.id}
                                        verHistoria={permisos.verHistoria}
                                        editar={permisos.editar}
                                        activo={p.activo !== false}
                                        puedeDesactivar={permisos.desactivar}
                                        onCambiarEstado={() => setACambiar(p)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.pie}>
                        <small className="text-muted">
                            Mostrando {data.items.length} de {data.total} pacientes
                        </small>
                        <Paginacion
                            page={data.page}
                            totalPages={data.totalPages}
                            onChange={(n) => actualizar({ page: String(n) })}
                        />
                    </div>
                </>
            )}

            <ModalConfirmar
                show={aCambiar !== null}
                titulo={aCambiar?.activo === false ? 'Reactivar paciente' : 'Desactivar paciente'}
                mensaje={
                    aCambiar?.activo === false
                        ? `¿Querés reactivar a ${aCambiar.apellido}, ${aCambiar.nombre}? Va a poder volver a sacar turnos y entrar con su cuenta.`
                        : aCambiar
                          ? `¿Querés desactivar a ${aCambiar.apellido}, ${aCambiar.nombre}? No va a poder sacar turnos ni entrar con su cuenta. Sus datos y su historia clínica se conservan, y se puede reactivar cuando quieras.`
                          : ''
                }
                textoConfirmar={aCambiar?.activo === false ? 'Sí, reactivar' : 'Sí, desactivar'}
                variante={aCambiar?.activo === false ? 'success' : 'danger'}
                onConfirmar={confirmarCambio}
                onCancelar={() => setACambiar(null)}
            />
        </Container>
        </div>
    );
};

export default PacienteList;