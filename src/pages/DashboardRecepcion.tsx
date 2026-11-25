import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Table, Button, ButtonGroup, Badge, Form, InputGroup, Row, Col, Pagination } from "react-bootstrap";
import { ArrowCounterclockwise, CheckLg, Eye, GeoAlt, PersonBadge, PersonX, PlusLg, Search, Trash, XCircle } from "react-bootstrap-icons";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import clientesAxios from "../config/axios";
import { useFetch } from "../hooks/useFetch";
import ListSkeleton from "../components/utils/ListSkeleton";
import type { ITurno } from "../types/Turno.Types";
import type { IPaginado } from "../types/Paciente.type";
import type { IConsultorio } from "../types/Consultorio.types";
import { obtenerRol } from "../components/utils/sesion";
import { esUrgencia } from "../components/utils/EsUrgencia";
import ModalConfirmar from "../components/utils/ModalConfirmar";
import CampoFecha from "../components/utils/CampoFecha";
import DetalleTurnoModal from "../components/turnos/DetalleTurnoModal";
import {
    aFecha,
    claveLocal,
    diaDelTurno,
    formatearFechaCorta,
    formatearHora,
    sumarDias,
    tituloDia,
} from "../components/utils/fecha";
import styles from "./DashboardRecepcion.module.scss";
import tabla from "./DashboardTabla.module.scss";

// Un día se pide completo (es corto); "Todos los turnos" y la búsqueda se pagan de a poco
const POR_DIA = 100;
const POR_PAGINA = 20;

type Orden = "fecha" | "paciente";
type Sentido = "asc" | "desc";
type FiltroEstado = "" | "pendiente" | "atendido" | "no_asistio";
type EstadoTurno = ITurno["estado"];

const esFiltroEstado = (valor: string): valor is FiltroEstado =>
    valor === "" || valor === "pendiente" || valor === "atendido" || valor === "no_asistio";

interface Resumen {
    total: number;
    pendientes: number;
    atendidos: number;
    noAsistieron: number;
}
type Respuesta = IPaginado<ITurno> & { resumen: Resumen };

const CLAVE_RESUMEN: Partial<Record<EstadoTurno, keyof Resumen>> = {
    pendiente: "pendientes",
    atendido: "atendidos",
    no_asistio: "noAsistieron",
};

// [color de la etiqueta, texto, color del texto]
const ESTADOS = {
    pendiente: ["warning", "Pendiente", "dark"],
    atendido: ["success", "Atendido", undefined],
    cancelado: ["secondary", "Cancelado", undefined],
    no_asistio: ["dark", "No asistió", undefined],
} as const;

const claseFila = (estado: string) =>
    estado === "atendido" ? tabla.filaAtendida : estado === "no_asistio" ? tabla.filaNoAsistio : tabla.filaPendiente;

const claseTarjeta = (estado: string) =>
    estado === "atendido"
        ? `${tabla.tarjeta} ${tabla.tarjetaAtendida}`
        : estado === "no_asistio"
          ? `${tabla.tarjeta} ${tabla.tarjetaNoAsistio}`
          : tabla.tarjeta;

const claseOpcion = (activa: boolean) => `${styles.opcion} ${activa ? styles.opcionActiva : ""}`;

// respuestaEstandar devuelve el texto en "message"
const mensajeDeError = (error: unknown, porDefecto: string) =>
    (isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined) ?? porDefecto;

interface PaginacionProps {
    page: number;
    totalPages: number;
    onChange: (pagina: number) => void;
}

const Paginacion = ({ page, totalPages, onChange }: PaginacionProps) => {
    const desde = Math.max(1, Math.min(page - 2, totalPages - 4));
    const paginas = Array.from({ length: Math.min(5, totalPages) }, (_, i) => desde + i);
    return (
        <Pagination className="mb-0">
            <Pagination.Prev disabled={page === 1} onClick={() => onChange(page - 1)} />
            {paginas.map(n => (
                <Pagination.Item key={n} active={n === page} onClick={() => onChange(n)}>{n}</Pagination.Item>
            ))}
            <Pagination.Next disabled={page === totalPages} onClick={() => onChange(page + 1)} />
        </Pagination>
    );
};

const DashboardRecepcion = () => {
    const hoy = claveLocal(new Date());
    const manana = sumarDias(hoy, 1);

    // El estado de la pantalla vive en la URL: se puede compartir y "atrás" del navegador funciona
    const [params, setParams] = useSearchParams();
    const timerPaciente = useRef<number | undefined>(undefined);
    const timerMedico = useRef<number | undefined>(undefined);

    const q = (params.get("q") ?? "").trim();
    const medico = (params.get("medico") ?? "").trim();
    const fecha = params.get("fecha") ?? hoy;
    const todos = params.get("todos") === "1";
    const estadoParam = params.get("estado") ?? "";
    const estado: FiltroEstado = esFiltroEstado(estadoParam) ? estadoParam : "";
    const consultorio = params.get("consultorio") ?? "";
    const page = Math.max(1, Number(params.get("page")) || 1);

    // Lo que se escribe en los buscadores (la URL se actualiza 400 ms después de la última tecla)
    const [textoPaciente, setTextoPaciente] = useState(q);
    const [textoMedico, setTextoMedico] = useState(medico);

    const buscando = q.length > 0;
    // Con búsqueda o "Todos los turnos" no se filtra por día
    const variasFechas = buscando || todos;

    const sort: Orden = params.get("sort") === "paciente" ? "paciente" : "fecha";
    const ordenParam = params.get("order");
    // Por defecto: el día va de la hora más temprana a la más tarde; el resto, lo más nuevo primero
    const sentido: Sentido =
        ordenParam === "asc" || ordenParam === "desc" ? ordenParam : sort === "fecha" && variasFechas ? "desc" : "asc";

    const [turnoAEliminar, setTurnoAEliminar] = useState<string | null>(null);
    const [turnoNoAsistio, setTurnoNoAsistio] = useState<string | null>(null);
    const [idDetalle, setIdDetalle] = useState<string | null>(null);
    // Selección múltiple (para cancelar varios turnos pendientes de una vez)
    const [seleccionando, setSeleccionando] = useState(false);
    const [seleccion, setSeleccion] = useState<string[]>([]);
    const [aCancelar, setACancelar] = useState<string[] | null>(null);

    const query = new URLSearchParams({
        page: String(page),
        limit: String(variasFechas ? POR_PAGINA : POR_DIA),
        sort,
        order: sentido,
    });
    if (!variasFechas) query.set("fecha", fecha);
    if (q) query.set("q", q.replace(/\./g, ""));
    if (medico) query.set("medico", medico);
    if (estado) query.set("estado", estado);
    if (consultorio) query.set("consultorio", consultorio);

    const { data, setData, isLoading, error, refetch } = useFetch<Respuesta>(`/turnos?${query.toString()}`);
    const { data: listaConsultorios } = useFetch<IConsultorio[]>("/consultorios?activo=true");

    const lista = data?.items ?? [];
    const resumen = data?.resumen;
    // Solo el admin puede eliminar (así lo exige el backend)
    const puedeEliminar = obtenerRol() === "ADMIN";

    // Cambia la URL; cualquier cambio vuelve a la página 1 salvo que se indique la página
    const actualizar = (cambios: Record<string, string>) => {
        // Otra página u otro filtro: la selección anterior ya no se ve, así que se descarta
        setSeleccion([]);
        setParams(prev => {
            const next = new URLSearchParams(prev);
            if (!("page" in cambios)) next.delete("page");
            Object.entries(cambios).forEach(([clave, valor]) => (valor ? next.set(clave, valor) : next.delete(clave)));
            return next;
        });
    };

    const onBuscarPaciente = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value;
        setTextoPaciente(valor);
        window.clearTimeout(timerPaciente.current);
        timerPaciente.current = window.setTimeout(() => actualizar({ q: valor.trim() }), 400);
    };

    const onBuscarMedico = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value;
        setTextoMedico(valor);
        window.clearTimeout(timerMedico.current);
        timerMedico.current = window.setTimeout(() => actualizar({ medico: valor.trim() }), 400);
    };

    // Elegir un día vuelve a la vista diaria: se limpia la búsqueda y el orden vuelve al normal
    const elegirDia = (dia: string) => {
        window.clearTimeout(timerPaciente.current);
        setTextoPaciente("");
        actualizar({ fecha: dia, todos: "", q: "", sort: "", order: "" });
    };

    const verTodos = () => {
        window.clearTimeout(timerPaciente.current);
        setTextoPaciente("");
        // Arranca con lo más nuevo arriba (es el orden por defecto en esta vista)
        actualizar({ todos: "1", q: "", sort: "", order: "" });
    };

    // Tocar el orden que ya está activo invierte el sentido; tocar otro lo activa con su sentido normal
    const ordenarPor = (campo: Orden) => {
        if (sort === campo) {
            actualizar({ order: sentido === "asc" ? "desc" : "asc" });
        } else {
            actualizar({ sort: campo === "paciente" ? "paciente" : "", order: "" });
        }
    };

    const flecha = (campo: Orden) => (sort !== campo ? " ↕" : sentido === "asc" ? " ▲" : " ▼");
    const ariaOrden = (campo: Orden) => (sort !== campo ? "none" : sentido === "asc" ? "ascending" : "descending");
    const ayudaOrden = (campo: Orden) =>
        campo === "paciente"
            ? sort === "paciente" && sentido === "desc" ? "De la Z a la A (tocá para invertir)" : "De la A a la Z (tocá para invertir)"
            : sort === "fecha" && sentido === "desc" ? "Más nuevos primero (tocá para invertir)" : "Más viejos primero (tocá para invertir)";

    const turnoVisto = lista.find(turno => turno.id === idDetalle) ?? null;

    // Actualiza la fila y los contadores sin volver a pedir todo; con un filtro de estado activo
    // el turno ya no corresponde a la lista, así que ahí sí se vuelve a consultar.
    const cambiarEstado = (id: string, nuevo: EstadoTurno) => {
        if (!data) return;
        const anterior = data.items.find(turno => turno.id === id)?.estado;
        const resumenNuevo = { ...data.resumen };
        const claveAnterior = anterior ? CLAVE_RESUMEN[anterior] : undefined;
        const claveNueva = CLAVE_RESUMEN[nuevo];
        if (claveAnterior) resumenNuevo[claveAnterior] -= 1;
        if (claveNueva) resumenNuevo[claveNueva] += 1;
        setData({
            ...data,
            items: data.items.map(turno => (turno.id === id ? { ...turno, estado: nuevo } : turno)),
            resumen: resumenNuevo,
        });
        if (estado) void refetch();
    };

    const marcarComoAtendido = async (idTurno: string) => {
        try {
            await clientesAxios.patch(`/turnos/${idTurno}`);
            cambiarEstado(idTurno, "atendido");
            toast.success("Turno marcado como atendido");
        } catch (error) {
            toast.error(mensajeDeError(error, "Error de red."));
        }
    };

    const confirmarNoAsistio = async () => {
        if (!turnoNoAsistio) return;
        try {
            await clientesAxios.patch(`/turnos/${turnoNoAsistio}/no-asistio`);
            cambiarEstado(turnoNoAsistio, "no_asistio");
            toast.success("Turno marcado como “no asistió”");
        } catch (error) {
            toast.error(mensajeDeError(error, "No se pudo marcar el turno."));
        } finally {
            setTurnoNoAsistio(null);
        }
    };

    // Corrige un “no asistió” marcado por error (solo el mismo día del turno)
    const deshacerNoAsistio = async (idTurno: string) => {
        try {
            await clientesAxios.patch(`/turnos/${idTurno}/deshacer-no-asistio`);
            cambiarEstado(idTurno, "pendiente");
            toast.success("El turno volvió a pendiente");
        } catch (error) {
            toast.error(mensajeDeError(error, "No se pudo deshacer."));
        }
    };

    // Solo los turnos pendientes se pueden cancelar
    const pendientesPagina = lista.filter(turno => turno.estado === "pendiente").map(turno => turno.id);
    const todasMarcadas = pendientesPagina.length > 0 && pendientesPagina.every(id => seleccion.includes(id));

    const alternarModo = (activo: boolean) => {
        setSeleccionando(activo);
        setSeleccion([]);
    };

    const alternarSeleccion = (id: string) =>
        setSeleccion(actual => (actual.includes(id) ? actual.filter(x => x !== id) : [...actual, id]));

    const seleccionarPagina = () => setSeleccion(todasMarcadas ? [] : pendientesPagina);

    const confirmarCancelar = async () => {
        if (!aCancelar) return;
        try {
            if (aCancelar.length === 1) {
                await clientesAxios.patch(`/turnos/${aCancelar[0]}/cancelar`);
                toast.success("Turno cancelado");
            } else {
                const { data: respuesta } = await clientesAxios.post<{ data: { cancelados: number; omitidos: number } }>(
                    "/turnos/cancelar-varios",
                    { ids: aCancelar },
                );
                const { cancelados, omitidos } = respuesta.data;
                toast.success(`${cancelados} ${cancelados === 1 ? "turno cancelado" : "turnos cancelados"}`);
                if (omitidos > 0) {
                    toast.warning(`${omitidos} no se cancelaron porque ya no estaban pendientes`, { duration: 8000 });
                }
            }
            setSeleccion([]);
            await refetch();
        } catch (error) {
            toast.error(mensajeDeError(error, "No se pudo cancelar."));
        } finally {
            setACancelar(null);
        }
    };

    // Al eliminar cambian el total y las páginas: se vuelve a consultar
    const confirmarEliminar = async () => {
        if (!turnoAEliminar) return;
        try {
            await clientesAxios.delete(`/turnos/${turnoAEliminar}`);
            toast.success("Turno eliminado");
            await refetch();
        } catch (error) {
            toast.error(mensajeDeError(error, "No se pudo eliminar el turno"));
        } finally {
            setTurnoAEliminar(null);
        }
    };

    // La hora del turno ya llegó (recién ahí se puede marcar que el paciente no asistió)
    const yaEmpezo = (turno: ITurno) => aFecha(turno.fechaTurno).getTime() <= Date.now();

    const cuando = (turno: ITurno) =>
        variasFechas
            ? `${formatearFechaCorta(turno.fechaTurno)} ${formatearHora(turno.fechaTurno)}`
            : formatearHora(turno.fechaTurno);

    const estadoDe = (turno: ITurno) => {
        const [bg, texto, textoColor] = ESTADOS[turno.estado] ?? ESTADOS.pendiente;
        return (
            <>
                <Badge bg={bg} text={textoColor}>{texto}</Badge>
                {esUrgencia(turno) && <Badge bg="danger" className="ms-1">Urgencia</Badge>}
            </>
        );
    };

    const accionesDe = (turno: ITurno) => (
        <div className="d-inline-flex gap-1">
            {turno.estado === "pendiente" && (
                <Button
                    size="sm"
                    variant="outline-success"
                    title="Marcar como atendido"
                    aria-label="Marcar como atendido"
                    onClick={() => marcarComoAtendido(turno.id)}
                >
                    <CheckLg />
                </Button>
            )}
            {turno.estado === "pendiente" && yaEmpezo(turno) && (
                <Button
                    size="sm"
                    variant="outline-dark"
                    title="El paciente no asistió"
                    aria-label="El paciente no asistió"
                    onClick={() => setTurnoNoAsistio(turno.id)}
                >
                    <PersonX />
                </Button>
            )}
            {turno.estado === "no_asistio" && diaDelTurno(turno.fechaTurno) === hoy && (
                <Button
                    size="sm"
                    variant="outline-secondary"
                    title="Deshacer “no asistió”"
                    aria-label="Deshacer no asistió"
                    onClick={() => deshacerNoAsistio(turno.id)}
                >
                    <ArrowCounterclockwise />
                </Button>
            )}
            <Button
                size="sm"
                variant="outline-info"
                title="Ver detalle"
                aria-label="Ver detalle"
                onClick={() => setIdDetalle(turno.id)}
            >
                <Eye />
            </Button>
            {turno.estado === "pendiente" && (
                <Button
                    size="sm"
                    variant="outline-warning"
                    title="Cancelar turno"
                    aria-label="Cancelar turno"
                    onClick={() => setACancelar([turno.id])}
                >
                    <XCircle />
                </Button>
            )}
            {puedeEliminar && (
                <Button
                    size="sm"
                    variant="outline-danger"
                    title="Eliminar"
                    aria-label="Eliminar"
                    onClick={() => setTurnoAEliminar(turno.id)}
                >
                    <Trash />
                </Button>
            )}
        </div>
    );

    const hayFiltros = Boolean(q || medico || estado || consultorio);

    const casilla = (turno: ITurno) =>
        turno.estado === "pendiente" ? (
            <Form.Check
                type="checkbox"
                aria-label="Seleccionar turno"
                checked={seleccion.includes(turno.id)}
                onChange={() => alternarSeleccion(turno.id)}
            />
        ) : null;

    return (
        <div>
            {/* Encabezado */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                    <h4 className={`${tabla.titulo} text-capitalize`}>
                        {buscando ? "Búsqueda en todas las fechas" : todos ? "Todos los turnos" : tituloDia(fecha)}
                    </h4>
                    <div className="d-flex flex-wrap gap-2">
                        {variasFechas ? (
                            data && <Badge bg="secondary">{data.total} {data.total === 1 ? "turno" : "turnos"}</Badge>
                        ) : (
                            resumen && (
                                <>
                                    <Badge bg="secondary">{resumen.total} turnos</Badge>
                                    <Badge bg="warning" text="dark">{resumen.pendientes} pendientes</Badge>
                                    <Badge bg="success">{resumen.atendidos} atendidos</Badge>
                                    {resumen.noAsistieron > 0 && <Badge bg="dark">{resumen.noAsistieron} no asistieron</Badge>}
                                </>
                            )
                        )}
                    </div>
                </div>
                <Link to="/turnos" className={`btn ${styles.botonPrincipal} d-inline-flex align-items-center gap-1`}>
                    <PlusLg /> Nuevo turno
                </Link>
            </div>

            {/* Búsqueda y fecha */}
            <Row className="g-2 mb-2">
                <Col xs={12} lg={4}>
                    <InputGroup>
                        <InputGroup.Text><Search /></InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por nombre, apellido o DNI"
                            aria-label="Buscar paciente"
                            value={textoPaciente}
                            onChange={onBuscarPaciente}
                        />
                    </InputGroup>
                </Col>
                <Col xs={12} sm={6} lg={5}>
                    <ButtonGroup className="w-100">
                        <Button
                            variant="light"
                            className={claseOpcion(!variasFechas && fecha === hoy)}
                            onClick={() => elegirDia(hoy)}
                        >
                            Hoy
                        </Button>
                        <Button
                            variant="light"
                            className={claseOpcion(!variasFechas && fecha === manana)}
                            onClick={() => elegirDia(manana)}
                        >
                            Mañana
                        </Button>
                        <Button variant="light" className={claseOpcion(todos && !buscando)} onClick={verTodos}>
                            Todos los turnos
                        </Button>
                    </ButtonGroup>
                </Col>
                <Col xs={12} sm={6} lg={3}>
                    <CampoFecha
                        valor={fecha}
                        ariaLabel="Elegir fecha"
                        onChange={dia => dia && elegirDia(dia)}
                    />
                </Col>
            </Row>

            {/* Filtros */}
            <Row className="g-2 mb-3">
                <Col xs={12} sm={6} lg={3}>
                    <InputGroup>
                        <InputGroup.Text><PersonBadge /></InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar médico (nombre o apellido)"
                            value={textoMedico}
                            aria-label="Buscar médico"
                            onChange={onBuscarMedico}
                        />
                    </InputGroup>
                </Col>
                <Col xs={12} sm={6} lg={3}>
                    <InputGroup>
                        <InputGroup.Text><GeoAlt /></InputGroup.Text>
                        <Form.Select
                            value={consultorio}
                            aria-label="Filtrar por consultorio"
                            onChange={e => actualizar({ consultorio: e.target.value })}
                        >
                            <option value="">Todos los consultorios</option>
                            {(listaConsultorios ?? []).map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </Form.Select>
                    </InputGroup>
                </Col>
                <Col xs={12} sm={6} lg={3}>
                    <Form.Select
                        value={estado}
                        aria-label="Filtrar por estado"
                        onChange={e => actualizar({ estado: e.target.value })}
                    >
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="atendido">Atendidos</option>
                        <option value="no_asistio">No asistieron</option>
                    </Form.Select>
                </Col>
                <Col xs={12} sm={6} lg={3}>
                    <ButtonGroup className="w-100">
                        <Button
                            variant="light"
                            className={claseOpcion(sort === "fecha")}
                            title={ayudaOrden("fecha")}
                            onClick={() => ordenarPor("fecha")}
                        >
                            {variasFechas ? "Por fecha" : "Por hora"}{flecha("fecha")}
                        </Button>
                        <Button
                            variant="light"
                            className={claseOpcion(sort === "paciente")}
                            title={ayudaOrden("paciente")}
                            onClick={() => ordenarPor("paciente")}
                        >
                            A-Z{flecha("paciente")}
                        </Button>
                    </ButtonGroup>
                </Col>
            </Row>

            {/* Selección múltiple */}
            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                <Form.Check
                    type="switch"
                    id="modo-seleccion"
                    label="Seleccionar varios"
                    checked={seleccionando}
                    onChange={e => alternarModo(e.target.checked)}
                />
                {seleccionando && (
                    <>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            disabled={pendientesPagina.length === 0}
                            onClick={seleccionarPagina}
                        >
                            {todasMarcadas ? "Quitar selección" : `Seleccionar los ${pendientesPagina.length} pendientes de esta página`}
                        </Button>
                        <span className="text-muted small">
                            {seleccion.length} {seleccion.length === 1 ? "seleccionado" : "seleccionados"}
                        </span>
                        <Button
                            size="sm"
                            variant="danger"
                            disabled={seleccion.length === 0}
                            onClick={() => setACancelar(seleccion)}
                        >
                            Cancelar turnos seleccionados
                        </Button>
                    </>
                )}
            </div>

            {error && (
                <Alert variant="danger" className="d-flex justify-content-between align-items-center">
                    No pudimos cargar los turnos.
                    <Button size="sm" variant="outline-danger" onClick={() => void refetch()}>Reintentar</Button>
                </Alert>
            )}

            {/* Tabla */}
            {isLoading ? (
                <ListSkeleton rows={5} />
            ) : data && lista.length === 0 ? (
                <div className="text-center text-muted py-5 bg-white rounded shadow-sm">
                    {buscando
                        ? `Sin resultados para “${q}”.`
                        : hayFiltros
                            ? "No hay turnos con esos filtros."
                            : todos
                                ? "Todavía no hay turnos cargados."
                                : "No hay turnos para este día."}
                </div>
            ) : data && (
                <>
                    {/* Escritorio: tabla */}
                    <Table hover responsive className={`d-none d-md-table align-middle ${tabla.tabla}`}>
                        <thead>
                            <tr>
                                {seleccionando && (
                                    <th style={{ width: 40 }}>
                                        <Form.Check
                                            type="checkbox"
                                            aria-label="Seleccionar todos los pendientes de la página"
                                            checked={todasMarcadas}
                                            disabled={pendientesPagina.length === 0}
                                            onChange={seleccionarPagina}
                                        />
                                    </th>
                                )}
                                <th
                                    style={{ cursor: "pointer", userSelect: "none" }}
                                    role="button"
                                    tabIndex={0}
                                    aria-sort={ariaOrden("fecha")}
                                    title={ayudaOrden("fecha")}
                                    onClick={() => ordenarPor("fecha")}
                                    onKeyDown={e => e.key === "Enter" && ordenarPor("fecha")}
                                >
                                    {variasFechas ? "Fecha y hora" : "Hora"}{flecha("fecha")}
                                </th>
                                <th
                                    style={{ cursor: "pointer", userSelect: "none" }}
                                    role="button"
                                    tabIndex={0}
                                    aria-sort={ariaOrden("paciente")}
                                    title={ayudaOrden("paciente")}
                                    onClick={() => ordenarPor("paciente")}
                                    onKeyDown={e => e.key === "Enter" && ordenarPor("paciente")}
                                >
                                    Paciente{flecha("paciente")}
                                </th>
                                <th>Médico</th>
                                <th>Consultorio</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map(turno => (
                                <tr key={turno.id} className={claseFila(turno.estado)}>
                                    {seleccionando && <td>{casilla(turno)}</td>}
                                    <td className="text-nowrap">
                                        <span className={tabla.hora}>{cuando(turno)}</span>
                                    </td>
                                    <td>
                                        <div className={tabla.principal}>{turno.paciente.apellido}, {turno.paciente.nombre}</div>
                                        <div className={tabla.secundario}>DNI {turno.paciente.dni}</div>
                                    </td>
                                    <td>
                                        <div className={tabla.principal}>{turno.medico.apellido}, {turno.medico.nombre}</div>
                                        <div className={tabla.secundario}>{turno.especialidad?.nombre}</div>
                                    </td>
                                    <td>{turno.consultorio?.nombre ?? "—"}</td>
                                    <td className="text-nowrap">{estadoDe(turno)}</td>
                                    <td className="text-end text-nowrap">{accionesDe(turno)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {/* Celular: tarjetas */}
                    <div className="d-md-none d-grid gap-3">
                        {lista.map(turno => (
                            <div key={turno.id} className={claseTarjeta(turno.estado)}>
                                <div className={tabla.tarjetaCabecera}>
                                    <span className={tabla.hora}>
                                        {seleccionando && <span className="me-2">{casilla(turno)}</span>}
                                        {cuando(turno)}
                                    </span>
                                    <span>{estadoDe(turno)}</span>
                                </div>
                                <div className={tabla.tarjetaFila}>
                                    <div className={tabla.principal}>{turno.paciente.apellido}, {turno.paciente.nombre}</div>
                                    <div className={tabla.secundario}>DNI {turno.paciente.dni}</div>
                                </div>
                                <div className={tabla.tarjetaFila}>
                                    <div className={tabla.principal}>{turno.medico.apellido}, {turno.medico.nombre}</div>
                                    <div className={tabla.secundario}>
                                        {turno.especialidad?.nombre} · {turno.consultorio?.nombre ?? "Sin consultorio"}
                                    </div>
                                </div>
                                <div className="mt-3">{accionesDe(turno)}</div>
                            </div>
                        ))}
                    </div>

                    {data.totalPages > 1 && (
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                            <small className="text-muted">
                                Mostrando {lista.length} de {data.total} turnos
                            </small>
                            <Paginacion
                                page={data.page}
                                totalPages={data.totalPages}
                                onChange={n => actualizar({ page: String(n) })}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Confirmación de borrado */}
            <DetalleTurnoModal
                turno={turnoVisto}
                puedeEliminar={puedeEliminar}
                onCerrar={() => setIdDetalle(null)}
                onAtendido={marcarComoAtendido}
                onReprogramado={() => {
                    setIdDetalle(null);
                    refetch();
                }}
                onEliminar={id => {
                    setIdDetalle(null);
                    setTurnoAEliminar(id);
                }}
            />

            <ModalConfirmar
                show={turnoNoAsistio !== null}
                titulo="El paciente no asistió"
                mensaje="¿Confirmás que el paciente no se presentó a este turno? El horario no se libera. Si te equivocás, podés deshacerlo hasta el final del mismo día."
                textoConfirmar="Sí, no asistió"
                onConfirmar={confirmarNoAsistio}
                onCancelar={() => setTurnoNoAsistio(null)}
            />

            <ModalConfirmar
                show={aCancelar !== null}
                titulo={aCancelar && aCancelar.length > 1 ? "Cancelar turnos" : "Cancelar turno"}
                mensaje={
                    aCancelar && aCancelar.length > 1
                        ? `¿Cancelar ${aCancelar.length} turnos pendientes? Se liberan los horarios y no se puede deshacer.`
                        : "¿Cancelar este turno? Se libera el horario y no se puede deshacer."
                }
                textoConfirmar="Sí, cancelar"
                textoCancelar="No, volver"
                variante="danger"
                onConfirmar={confirmarCancelar}
                onCancelar={() => setACancelar(null)}
            />

            <ModalConfirmar
                show={turnoAEliminar !== null}
                titulo="Eliminar turno"
                mensaje="¿Seguro que querés eliminar este turno? Esta acción no se puede deshacer."
                textoConfirmar="Sí, eliminar"
                onConfirmar={confirmarEliminar}
                onCancelar={() => setTurnoAEliminar(null)}
            />
        </div>
    );
};

export default DashboardRecepcion;