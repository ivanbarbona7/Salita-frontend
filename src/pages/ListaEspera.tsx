import { useState } from 'react';
import { Alert, Badge, Button, Form, InputGroup, Placeholder, Table } from 'react-bootstrap';
import { HourglassSplit, Search, XLg } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import clientesAxios from '../config/axios';
import { useFetch } from '../hooks/useFetch';
import ModalConfirmar from '../components/utils/ModalConfirmar';
import { obtenerMensajeError } from '../components/utils/obtenerMensajeError';
import formulario from '../components/utils/Formulario.module.scss';
import tabla from './DashboardTabla.module.scss';
import styles from './ListaEspera.module.scss';
import type { IEspera, IHueco } from '../types/Espera.types';

const ZONA = 'America/Argentina/Buenos_Aires';

const fechaLarga = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ZONA });
const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA });
const fechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: ZONA });

const telefonoDe = (p: IEspera['paciente']) =>
    p.telefono?.numero ? `${p.telefono.codigoArea ? `(${p.telefono.codigoArea}) ` : ''}${p.telefono.numero}` : 'sin teléfono';

type Vista = 'huecos' | 'espera';

interface MedicoOpcion {
    id: string;
    nombre: string;
    apellido: string;
    especialidad?: { nombre?: string };
}

interface PacienteEncontrado {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
}

// Acción pendiente de confirmar
type Pendiente =
    | { tipo: 'asignar'; hueco: IHueco; entrada: IEspera }
    | { tipo: 'quitar'; entrada: IEspera };

const ListaEspera = () => {
    const [vista, setVista] = useState<Vista>('huecos');
    const [pendiente, setPendiente] = useState<Pendiente | null>(null);

    // Formulario "anotar a alguien"
    const [dni, setDni] = useState('');
    const [paciente, setPaciente] = useState<PacienteEncontrado | null>(null);
    const [errorDni, setErrorDni] = useState('');
    const [medicoId, setMedicoId] = useState('');
    const [nota, setNota] = useState('');
    const [guardando, setGuardando] = useState(false);

    const huecos = useFetch<IHueco[]>('/espera/huecos');
    const espera = useFetch<IEspera[]>('/espera');
    // Los médicos solo hacen falta para anotar a alguien
    const medicos = useFetch<MedicoOpcion[]>(vista === 'espera' ? '/medicos?activo=true' : null);

    const recargar = async () => {
        await Promise.all([huecos.refetch(), espera.refetch()]);
    };

    const buscarPaciente = async () => {
        setPaciente(null);
        setErrorDni('');
        const limpio = dni.trim();
        if (!/^\d{7,8}$/.test(limpio)) {
            setErrorDni('El DNI debe tener 7 u 8 números, sin puntos');
            return;
        }
        try {
            const { data } = await clientesAxios.get<{ data: { items: PacienteEncontrado[] } }>('/pacientes', {
                params: { dni: limpio },
            });
            const encontrado = data.data.items[0];
            if (!encontrado) {
                setErrorDni('No existe un paciente registrado con ese DNI');
                return;
            }
            setPaciente(encontrado);
        } catch (error: unknown) {
            setErrorDni(obtenerMensajeError(error));
        }
    };

    const anotar = async () => {
        if (!paciente || !medicoId) return;
        setGuardando(true);
        try {
            await clientesAxios.post('/espera', {
                paciente: paciente.id,
                medico: medicoId,
                ...(nota.trim() ? { nota: nota.trim() } : {}),
            });
            toast.success('Paciente anotado en la lista de espera');
            setDni('');
            setPaciente(null);
            setMedicoId('');
            setNota('');
            await recargar();
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setGuardando(false);
        }
    };

    const confirmar = async () => {
        if (!pendiente) return;
        try {
            if (pendiente.tipo === 'asignar') {
                await clientesAxios.post(`/espera/${pendiente.entrada.id}/asignar`, {
                    consultorio: pendiente.hueco.consultorio.id,
                    fechaTurno: pendiente.hueco.fechaTurno,
                });
                toast.success('Turno asignado. Avisale al paciente.');
            } else {
                await clientesAxios.patch(`/espera/${pendiente.entrada.id}/cancelar`);
                toast.success('Se sacó al paciente de la lista de espera');
            }
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error), { duration: 8000 });
        } finally {
            setPendiente(null);
            await recargar();
        }
    };

    const cargando = (huecos.isLoading && !huecos.data) || (espera.isLoading && !espera.data);
    const listaHuecos = huecos.data ?? [];
    const listaEspera = espera.data ?? [];

    return (
        <div className={formulario.pagina}>
            <div className={styles.contenedor}>
                <div className={styles.encabezado}>
                    <h3 className={styles.titulo}>
                        <HourglassSplit size={28} /> Lista de espera
                    </h3>
                    <p className={styles.subtitulo}>
                        Cuando se cancela un turno, acá ves a quién ofrecérselo, en el orden en que se anotaron.
                    </p>
                </div>

                <div className={styles.pills} role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={vista === 'huecos'}
                        className={`${styles.pill} ${vista === 'huecos' ? styles.pillActiva : ''}`}
                        onClick={() => setVista('huecos')}
                    >
                        Horarios liberados <span className={styles.contador}>{listaHuecos.length}</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={vista === 'espera'}
                        className={`${styles.pill} ${vista === 'espera' ? styles.pillActiva : ''}`}
                        onClick={() => setVista('espera')}
                    >
                        En espera <span className={styles.contador}>{listaEspera.length}</span>
                    </button>
                </div>

                {(huecos.error || espera.error) && (
                    <Alert variant="danger" className="d-flex justify-content-between align-items-center">
                        No pudimos cargar la lista de espera.
                        <Button size="sm" variant="outline-danger" onClick={() => void recargar()}>Reintentar</Button>
                    </Alert>
                )}

                {cargando && (
                    <Placeholder animation="glow" aria-busy="true">
                        {Array.from({ length: 3 }, (_, i) => (
                            <Placeholder key={i} xs={12} style={{ height: '5rem', borderRadius: 12, marginBottom: 12 }} />
                        ))}
                    </Placeholder>
                )}

                {/* ---------- HORARIOS LIBERADOS ---------- */}
                {!cargando && vista === 'huecos' && (
                    <>
                        {listaHuecos.length === 0 ? (
                            <div className={styles.vacio}>
                                No hay horarios liberados con gente esperando. Cuando se cancele un turno de un médico
                                que tenga pacientes en espera, aparece acá.
                            </div>
                        ) : (
                            listaHuecos.map((h) => (
                                <section key={h.clave} className={styles.hueco}>
                                    <div className={styles.huecoCab}>
                                        <p className={styles.huecoFecha}>
                                            {fechaLarga(h.fechaTurno)} · {hora(h.fechaTurno)} hs
                                        </p>
                                        <p className={styles.huecoMeta}>
                                            Dr/a. {h.medico.apellido}, {h.medico.nombre}
                                            {h.especialidad.nombre ? ` · ${h.especialidad.nombre}` : ''}
                                            {h.consultorio.nombre ? ` · ${h.consultorio.nombre}` : ''}
                                        </p>
                                    </div>
                                    {h.candidatos.map((c, i) => (
                                        <div key={c.id} className={styles.candidato}>
                                            <span className={styles.orden} aria-label={`Puesto ${i + 1}`}>{i + 1}</span>
                                            <div className={styles.candInfo}>
                                                <div className={styles.candNombre}>
                                                    {c.paciente.apellido}, {c.paciente.nombre}
                                                </div>
                                                <div className={styles.candDato}>
                                                    DNI {c.paciente.dni ?? '—'} · {telefonoDe(c.paciente)} · anotado el {fechaCorta(c.desde)}
                                                </div>
                                                {c.nota && <div className={styles.candDato}>“{c.nota}”</div>}
                                            </div>
                                            <Button
                                                size="sm"
                                                className={formulario.botonPrincipal}
                                                onClick={() => setPendiente({ tipo: 'asignar', hueco: h, entrada: c })}
                                            >
                                                Dar turno
                                            </Button>
                                        </div>
                                    ))}
                                </section>
                            ))
                        )}
                    </>
                )}

                {/* ---------- EN ESPERA ---------- */}
                {!cargando && vista === 'espera' && (
                    <>
                        <div className={styles.anotar}>
                            <h4 className={styles.anotarTitulo}>Anotar a un paciente</h4>
                            <div className={styles.anotarGrilla}>
                                <div>
                                    <Form.Label htmlFor="espera-dni">DNI del paciente</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            id="espera-dni"
                                            inputMode="numeric"
                                            placeholder="Sin puntos"
                                            value={dni}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                setDni(e.target.value);
                                                setPaciente(null);
                                                setErrorDni('');
                                            }}
                                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    void buscarPaciente();
                                                }
                                            }}
                                        />
                                        <Button variant="outline-primary" onClick={() => void buscarPaciente()} aria-label="Buscar paciente">
                                            <Search size={16} />
                                        </Button>
                                    </InputGroup>
                                    {errorDni && <div className="text-danger small mt-1" role="alert">{errorDni}</div>}
                                    {paciente && (
                                        <div className={styles.pacienteEncontrado}>
                                            {paciente.apellido}, {paciente.nombre} · DNI {paciente.dni}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Form.Label htmlFor="espera-medico">Médico</Form.Label>
                                    <Form.Select
                                        id="espera-medico"
                                        value={medicoId}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMedicoId(e.target.value)}
                                    >
                                        <option value="">Elegí un médico…</option>
                                        {(medicos.data ?? []).map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.apellido}, {m.nombre}
                                                {m.especialidad?.nombre ? ` — ${m.especialidad.nombre}` : ''}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </div>

                                <div>
                                    <Form.Label htmlFor="espera-nota">Nota (opcional)</Form.Label>
                                    <Form.Control
                                        id="espera-nota"
                                        maxLength={200}
                                        placeholder="Ej.: solo por la mañana"
                                        value={nota}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNota(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="mt-3 d-flex justify-content-end">
                                <Button
                                    className={formulario.botonPrincipal}
                                    disabled={!paciente || !medicoId || guardando}
                                    onClick={() => void anotar()}
                                >
                                    {guardando ? 'Guardando…' : 'Anotar en la espera'}
                                </Button>
                            </div>
                        </div>

                        {listaEspera.length === 0 ? (
                            <div className={styles.vacio}>No hay pacientes en la lista de espera.</div>
                        ) : (
                            <Table hover responsive className={`align-middle ${tabla.tabla}`}>
                                <thead>
                                    <tr>
                                        <th>Paciente</th>
                                        <th>Médico</th>
                                        <th>Anotado</th>
                                        <th>Nota</th>
                                        <th className="text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaEspera.map((e) => (
                                        <tr key={e.id}>
                                            <td>
                                                <div className="fw-semibold">{e.paciente.apellido}, {e.paciente.nombre}</div>
                                                <div className="small text-muted">DNI {e.paciente.dni ?? '—'} · {telefonoDe(e.paciente)}</div>
                                            </td>
                                            <td>
                                                Dr/a. {e.medico.apellido}
                                                {e.especialidad.nombre && <Badge bg="info" className="ms-2">{e.especialidad.nombre}</Badge>}
                                            </td>
                                            <td className="text-nowrap">{fechaCorta(e.desde)}</td>
                                            <td>{e.nota ?? '—'}</td>
                                            <td className="text-end">
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    className="d-inline-flex align-items-center gap-1"
                                                    onClick={() => setPendiente({ tipo: 'quitar', entrada: e })}
                                                >
                                                    <XLg size={14} /> Quitar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </>
                )}

                <ModalConfirmar
                    show={pendiente !== null}
                    titulo={pendiente?.tipo === 'asignar' ? 'Dar turno' : 'Quitar de la lista de espera'}
                    mensaje={
                        pendiente?.tipo === 'asignar'
                            ? `¿Darle a ${pendiente.entrada.paciente.nombre} ${pendiente.entrada.paciente.apellido} el turno del ${fechaLarga(pendiente.hueco.fechaTurno)} a las ${hora(pendiente.hueco.fechaTurno)} hs? Acordate de avisarle.`
                            : pendiente
                                ? `¿Sacar a ${pendiente.entrada.paciente.nombre} ${pendiente.entrada.paciente.apellido} de la lista de espera?`
                                : ''
                    }
                    textoConfirmar={pendiente?.tipo === 'asignar' ? 'Sí, dar turno' : 'Sí, quitar'}
                    variante={pendiente?.tipo === 'asignar' ? 'success' : 'danger'}
                    onConfirmar={confirmar}
                    onCancelar={() => setPendiente(null)}
                />
            </div>
        </div>
    );
};

export default ListaEspera;